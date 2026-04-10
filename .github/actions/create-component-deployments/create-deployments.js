// @ts-check

/**
 * @typedef {import('@octokit/rest').Octokit} Octokit
 * @typedef {{ info: (msg: string) => void, warning: (msg: string) => void, startGroup: (name: string) => void, endGroup: () => void }} Core
 * @typedef {{ repo: string, ref: string, image: string }} Component
 * @typedef {{ token: string, environment: string, description: string, transient: boolean, createOnly: boolean }} DeploymentParams
 */

const GHCR_REGISTRY = 'https://ghcr.io';

/**
 * Fetch OCI image annotations from ghcr.io to resolve repo and git ref.
 *
 * Looks for standard OCI annotations:
 *   - org.opencontainers.image.revision → git SHA
 *   - org.opencontainers.image.source   → repo URL
 *
 * @param {string} image - e.g. "scality/playground/my-image"
 * @param {string} tag
 * @param {string} token - Bearer token with packages:read
 * @returns {Promise<{repo: string, ref: string} | null>}
 */
async function resolveFromManifest(image, tag, token) {
    // Get a scoped token from ghcr.io (Basic auth required for private images)
    const authResp = await fetch(`${GHCR_REGISTRY}/token?scope=repository:${image}:pull`, {
        headers: { Authorization: `Basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}` },
    });
    if (!authResp.ok) {
        return null;
    }
    const { token: registryToken } = await authResp.json();

    const headers = {
        Authorization: `Bearer ${registryToken}`,
        Accept: [
            'application/vnd.oci.image.manifest.v1+json',
            'application/vnd.docker.distribution.manifest.v2+json',
        ].join(', '),
    };

    // Fetch manifest
    const manifestResp = await fetch(`${GHCR_REGISTRY}/v2/${image}/manifests/${tag}`, { headers });
    if (!manifestResp.ok) {
        return null;
    }
    const manifest = await manifestResp.json();

    // Check manifest annotations first (OCI image manifest)
    let annotations = manifest.annotations || {};

    // If no revision in manifest annotations, check the config blob
    if (!annotations['org.opencontainers.image.revision'] && manifest.config) {
        const configResp = await fetch(`${GHCR_REGISTRY}/v2/${image}/blobs/${manifest.config.digest}`, { headers });
        if (configResp.ok) {
            const config = await configResp.json();
            annotations = config.config?.Labels || {};
        }
    }

    const ref = annotations['org.opencontainers.image.revision'];
    if (!ref) {
        return null;
    }

    // Derive repo from source annotation or image path
    const source = annotations['org.opencontainers.image.source'] || '';
    let repo = '';
    const ghMatch = source.match(/github\.com\/([^/]+\/[^/]+)/);
    if (ghMatch) {
        repo = ghMatch[1].replace(/\.git$/, '');
    }

    return { repo, ref };
}

/**
 * Find an existing deployment or create a new one.
 *
 * For status updates (success/failure), looks up an existing deployment first.
 * For in_progress, always creates a fresh one.
 *
 * @param {Octokit} github
 * @param {object} params
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {string} params.ref
 * @param {string} params.environment
 * @param {string} params.description
 * @param {boolean} params.transient
 * @param {boolean} params.createOnly - Skip lookup, always create
 * @returns {Promise<number>} deployment id
 */
async function findOrCreateDeployment(github, { owner, repo, ref, environment, description, transient, createOnly }) {
    if (!createOnly) {
        const { data: existing } = await github.rest.repos.listDeployments({
            owner, repo, environment, ref, per_page: 1,
        });
        if (existing.length > 0) {
            return existing[0].id;
        }
    }

    const { data } = await github.rest.repos.createDeployment({
        owner, repo, ref,
        environment,
        description,
        auto_merge: false,
        required_contexts: [],
        transient_environment: transient,
        production_environment: false,
    });

    return data.id;
}

/**
 * Resolve repo/ref from manifest if needed, then find or create a deployment.
 * If findOrCreateDeployment fails with 409/422 and repo was not yet resolved,
 * resolves from the manifest and retries once.
 *
 * @param {Octokit} github
 * @param {Core} core
 * @param {Function} resolve
 * @param {Component} component
 * @param {DeploymentParams} deployParams
 * @returns {Promise<{component: Component, deploymentId: number}>}
 */
async function resolveDeployment(github, core, resolve, { repo, ref, image }, deployParams) {
    const { token, environment, description, transient, createOnly } = deployParams;

    // Resolve repo/ref from manifest if not provided
    if (!repo) {
        const resolved = await resolve(image, ref, token);
        if (!resolved?.repo) {
            throw new Error(`Could not resolve repo for ${image}:${ref}`);
        }

        repo = resolved.repo;
        ref = resolved.ref || ref;
    }

    const [owner, repoName] = repo.split('/');
    try {
        const deploymentId = await findOrCreateDeployment(github, {
            owner, repo: repoName, ref, environment, description, transient, createOnly,
        });

        return { component: { repo, ref, image }, deploymentId };
    } catch (/** @type {any} */ err) {
        if (canRetry && (err.status === 409 || err.status === 422)) {
            core.info(`Ref "${ref}" not found on ${repo}, checking image manifest...`);
            return resolveDeployment(github, core, resolve, { repo: '', ref, image }, deployParams);
        }

        throw err;
    }
}

/**
 * Create or update GitHub Deployments on component repos.
 *
 * @param {object} params
 * @param {Octokit} params.github - Octokit instance
 * @param {Core} params.core - GitHub Actions core
 * @param {Array<Component>} params.components - Parsed component list
 * @param {string} params.environment - Deployment environment name
 * @param {string} params.status - Deployment status (in_progress, success, failure)
 * @param {boolean} params.transient - Whether deployments are transient
 * @param {string} params.logUrl - URL to link from the deployment status
 * @param {string} params.description - Human-readable description
 * @param {string} params.token - GitHub token with packages:read for manifest lookups
 */
async function createDeployments({ github, core, components, environment, status, transient, logUrl, description, token }) {
    const deployParams = { token, environment, description, transient, createOnly: status === 'in_progress' };
    let errors = 0;

    for (const component of components) {
        core.startGroup(`${component.repo || component.image}:${component.ref}`);

        try {
            const { component: resolved, deploymentId } = await resolveDeployment(
                github, core, resolveFromManifest, component, deployParams,
            );
            const [owner, repoName] = resolved.repo.split('/');
            core.info(`Resolved to ${resolved.repo} @ ${resolved.ref}`);

            await github.rest.repos.createDeploymentStatus({
                owner, repo: repoName,
                deployment_id: deploymentId,
                state: status,
                log_url: logUrl,
                description,
            });

            core.info(`Deployment ${deploymentId}, status: ${status}`);
        } catch (/** @type {any} */ err) {
            core.warning(`Failed on ${component.repo || component.image}: ${err.message}`);
            errors++;
        }

        core.endGroup();
    }

    if (errors > 0) {
        core.warning(`${errors} deployment(s) failed (non-fatal)`);
    }

    return errors;
}

module.exports = {
    findOrCreateDeployment,
    resolveDeployment,
    resolveFromManifest,
    createDeployments,
};
