// @ts-check

/**
 * @typedef {import('@octokit/rest').Octokit} Octokit
 * @typedef {{ info: (msg: string) => void, warning: (msg: string) => void, startGroup: (name: string) => void, endGroup: () => void }} Core
 */

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
 * Create or update GitHub Deployments on component repos.
 *
 * @param {object} params
 * @param {Octokit} params.github - Octokit instance
 * @param {Core} params.core - GitHub Actions core
 * @param {Array<{repo: string, ref: string}>} params.components - Parsed component list
 * @param {string} params.environment - Deployment environment name
 * @param {string} params.status - Deployment status (in_progress, success, failure)
 * @param {boolean} params.transient - Whether deployments are transient
 * @param {string} params.logUrl - URL to link from the deployment status
 * @param {string} params.description - Human-readable description
 */
async function createDeployments({ github, core, components, environment, status, transient, logUrl, description }) {
    let errors = 0;

    for (const { repo, ref } of components) {
        const [owner, repoName] = repo.split('/');
        core.startGroup(`${repo} @ ${ref}`);

        try {
            const deploymentId = await findOrCreateDeployment(github, {
                owner, repo: repoName, ref,
                environment, description, transient,
                createOnly: status === 'in_progress',
            });
            core.info(`Deployment ${deploymentId}`);

            await github.rest.repos.createDeploymentStatus({
                owner, repo: repoName,
                deployment_id: deploymentId,
                state: status,
                log_url: logUrl,
                description,
            });
            core.info(`Status: ${status}`);
        } catch (/** @type {any} */ err) {
            core.warning(`Failed on ${repo}: ${err.message}`);
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
    createDeployments,
};
