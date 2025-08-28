/**
 * Auto-derive artifacts name from successful staging build
 * 
 * This script is used in GitHub Actions to automatically find and construct
 * the artifacts name from a successful staging workflow run that contains
 * the build-iso-and-end2end-test job.
 * 
 * @param {Object} github - GitHub Actions toolkit github object
 * @param {Object} context - GitHub Actions context object
 * @param {Object} core - GitHub Actions core object for logging/errors
 * @returns {Promise<string>} The constructed artifacts name
 */
async function getBuildArtifact(github, context, core) {
  const workflow_id = 'build-iso-and-end2end-test'; // The workflow ID for the build job

  // Get the commit SHA for the tag
  const tagCommit = context.sha;
  core.info(`Looking for successful builds for commit: ${tagCommit}`);
  
  // Get workflow runs for this repository``
  const { data: workflowRuns } = await github.rest.actions.listWorkflowRuns({
    owner: context.repo.owner,
    repo: context.repo.repo,
    workflow_id,
    head_sha: tagCommit,
    status: 'completed',
    conclusion: 'success'
  });
  
  // Find the first successful staging workflow run
  const run = workflowRuns.workflow_runs[0];
  if (!run) {
    throw new Error(`No successful end2end workflow run found for commit ${tagCommit}`);
  }
  
  core.info(`Found staging run: ${run.id} with conclusion: ${run.conclusion}`);
  
  // Construct artifacts name, like scality/action-artifacts
  const commitHash = tagCommit.substring(0, 10); // use first 10 chars of commit hash
  const buildNumber = run.run_number;
  const artifactsName = `github:${context.repo.owner}:${context.repo.repo}:staging-${commitHash}.${workflow_id}.${buildNumber}`;
  
  core.info(`Auto-derived artifacts name: ${artifactsName}`);
  return artifactsName;
}

module.exports = { getBuildArtifact };

// For TypeScript imports
if (typeof exports !== 'undefined') {
  exports.getBuildArtifact = getBuildArtifact;
}