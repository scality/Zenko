// @ts-check

/**
 * @typedef {import('./create-deployments').Component} Component
 * @typedef {import('./create-deployments').Core} Core
 */

const { resolveFromManifest, resolveRef } = require('./create-deployments');

/**
 * Resolve a component's repo/ref as done when creating the deployment: via
 * OCI manifest when the repo is not set (playground-style).
 *
 * @param {any} github
 * @param {Component} component
 * @param {string} token
 * @returns {Promise<Component>}
 */
async function resolveRepo(github, component, token) {
    if (component.repo) {
        const ref = await resolveRef(github, component.repo, component.ref, component.image, token);
        return { ...component, ref };
    }
    const resolved = await resolveFromManifest(component.image, component.ref, token);
    if (!resolved?.repo) {
        throw new Error(`Could not resolve repo for ${component.image}:${component.ref}`);
    }
    return { ...component, repo: resolved.repo, ref: resolved.ref || component.ref };
}

/**
 * Inactivate deployments on component repos whose environment starts with
 * `environmentPrefix` and whose ref matches the component's ref.
 *
 * Walks each component, lists deployments at that ref (across all envs), and
 * flips every match to `inactive`. Non-fatal on individual failures so a
 * single bad repo doesn't block the rest.
 *
 * @param {object} params
 * @param {any} params.github - Octokit instance
 * @param {Core} params.core
 * @param {Array<Component>} params.components
 * @param {string} params.environmentPrefix - e.g. "zenko/improvement/ZKOP-534@"
 * @param {string} params.token - installation token (packages:read for manifest fallback)
 */
async function cleanupDeployments({ github, core, components, environmentPrefix, token }) {
    for (const component of components) {
        core.startGroup(`${component.repo || component.image}:${component.ref}`);

        try {
            const resolved = await resolveRepo(github, component, token);
            const [owner, repoName] = resolved.repo.split('/');

            const { data: deployments } = await github.rest.repos.listDeployments({
                owner, repo: repoName, ref: resolved.ref, per_page: 100,
            });
            const matches = deployments.filter(
                (/** @type {{environment: string}} */ d) => d.environment.startsWith(environmentPrefix),
            );

            if (matches.length === 0) {
                core.info(`No deployment at ref=${resolved.ref} with env prefix "${environmentPrefix}"`);
                core.endGroup();
                continue;
            }

            for (const d of matches) {
                await github.rest.repos.createDeploymentStatus({
                    owner, repo: repoName, deployment_id: d.id,
                    state: 'inactive',
                    description: 'Superseded',
                });
                core.info(`Inactivated deployment ${d.id} (env=${d.environment})`);
            }
        } catch (/** @type {any} */ err) {
            core.warning(`Failed on ${component.repo || component.image}: ${err.message}`);
        }

        core.endGroup();
    }
}

module.exports = { cleanupDeployments, resolveRepo };
