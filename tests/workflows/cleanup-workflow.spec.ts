import { Act } from "@kie/act-js";
import { MockGithub, Moctokit } from "@kie/mock-github";
import nock from "nock";
import path from "path";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { TEST_PRIVATE_KEY } from "./fixtures/test-private-key";

const exec = promisify(execCb);

let github: MockGithub;
let moctokit: Moctokit;
let act: Act;

async function getCommitHash(ref: string = "HEAD") {
    const { stdout } = await exec(
        `git -C ${github.repo.getPath("zenko")} rev-parse ${ref}`,
    );
    return stdout.trim();
}

function findStep(result: { name: string; status: number }[], nameFragment: string) {
    const idx = result.findIndex(r => r.name?.includes(nameFragment));
    if (idx < 0) {
        return undefined;
    }
    return { name: result[idx].name, status: result[idx + 1]?.status };
}

const BRANCH = "improvement/ZENKO-5210";
const ZEROS = "0000000000000000000000000000000000000000";

// Per-step patches — the step still runs as-is, we just inject `with:` inputs:
//  - actions/checkout: act's `isLocalCheckout` (run_context.go) treats the
//    step as "local" (→ docker-cp the workspace, skip real fetch) only if
//    `with.ref` matches github.ref. The workflow passes a SHA; override to
//    the branch ref so act takes the fast path.
//  - Parse component repos: its github-script step has no explicit
//    github-token, so it defaults to ${{ github.token }} — not set under
//    act. Inject one here instead of leaking a GITHUB_TOKEN env var globally.
const stepPatches = {
    cleanup: [
        {
            uses: "actions/checkout@v6",
            mockWith: { with: { ref: `refs/heads/${BRANCH}` } },
        },
        {
            name: "Parse component repos from deps.yaml",
            mockWith: { with: { "github-token": "fake-token" } },
        },
    ],
};

beforeEach(async () => {
    // Base commit on BRANCH: scripts + prior deps.yaml (this is `before`).
    github = new MockGithub({
        repo: {
            zenko: {
                pushedBranches: [BRANCH],
                files: [
                    { src: path.resolve(__dirname, "../..", ".github"), dest: ".github" },
                    { src: path.resolve(__dirname, "fixtures/test-deps-base.yaml"), dest: "solution/deps.yaml" },
                ],
            },
        },
    });
    await github.setup();

    // Layer a second commit on BRANCH with updated deps (HEAD = `after`,
    // HEAD^ = `before`), so tests can reference both via real SHAs.
    const repoPath = github.repo.getPath("zenko");
    const depsUpdate = path.resolve(__dirname, "fixtures/test-deps.yaml");
    await exec(`git -C ${repoPath} checkout ${BRANCH}`);
    await exec(`cp ${depsUpdate} ${repoPath}/solution/deps.yaml`);
    await exec(`git -C ${repoPath} commit --no-sign -am "bump deps"`);

    moctokit = new Moctokit("http://api.github.com");

    act = new Act(github.repo.getPath("zenko"));
    act.setWorkflowFile(".github/workflows/cleanup-deployments.yaml");

    act.setEnv("GITHUB_REPOSITORY", "scality/zenko");
    act.setEnv("GITHUB_API_URL", "http://api.github.com");
    act.setEnv("GITHUB_REF", `refs/heads/${BRANCH}`);

    act.setSecret("ACTIONS_APP_PRIVATE_KEY", TEST_PRIVATE_KEY);
    act.setVar("ACTIONS_APP_ID", "12345");

    act.setPlatforms("ubuntu-24.04", "ghcr.io/catthehacker/ubuntu:act-24.04");
});

afterEach(async () => {
    nock.cleanAll();
    await github.teardown();
});

const appTokenMocks = (m: Moctokit) => [
    m.rest.apps.getRepoInstallation().reply({
        status: 200, data: { id: 1, app_id: 12345, app_slug: "test-app" }, repeat: 5,
    }),
    m.rest.apps.createInstallationAccessToken().reply({
        status: 201, data: { token: "ghs_fake_token" }, repeat: 5,
    }),
];

describe("cleanup-deployments workflow", () => {
    it("inactivates matching deployments on normal push", async () => {
        // Post-step: token revocation (DELETE /installation/token, not in Moctokit)
        nock("http://api.github.com").delete("/installation/token").reply(204).persist();

        const before = await getCommitHash("HEAD^");
        const after = await getCommitHash();

        act.setEvent({
            before,
            after,
            created: false,
            deleted: false,
            ref: `refs/heads/${BRANCH}`,
        });

        const result = await act.runEvent("push", {
            logFile: process.env.ACT_LOG ? path.join(__dirname, "act-cleanup-push.log") : undefined,
            mockApi: [
                ...appTokenMocks(moctokit),

                // Workflow reads deps.yaml from `before` (HEAD^ = test-deps-base.yaml):
                // sorbet v1.2.1, backbeat 9.3.0 as scality components; kafka is filtered
                // as self-repo.

                // Sorbet: one matching deployment, one non-matching (dev branch shares ref)
                moctokit.rest.repos.listDeployments({
                    owner: "scality", repo: "sorbet", ref: "v1.2.1", per_page: 100,
                } as any).reply({
                    status: 200,
                    data: [
                        { id: 101, environment: `zenko/${BRANCH}@2.11` },
                        { id: 102, environment: "zenko/development/2.11" },
                    ],
                }),
                moctokit.rest.repos.createDeploymentStatus({
                    owner: "scality", repo: "sorbet", deployment_id: 101,
                    state: "inactive", description: "Superseded",
                }).reply({ status: 201, data: { id: 1 } }),

                // Backbeat: no deployments at that ref
                moctokit.rest.repos.listDeployments({
                    owner: "scality", repo: "backbeat", ref: "9.3.0", per_page: 100,
                } as any).reply({ status: 200, data: [] }),
            ],
            mockSteps: stepPatches,
        });

        expect(findStep(result, "Checkout scripts")?.status).toBe(0);
        expect(findStep(result, "Checkout before deps.yaml")?.status).toBe(0);
        expect(findStep(result, "Parse component repos")?.status).toBe(0);
        expect(findStep(result, "Generate scoped deployments token")?.status).toBe(0);
        expect(findStep(result, "Inactivate prior deployments")?.status).toBe(0);
    });

    it("inactivates deployments on branch deletion (push with deleted=true)", async () => {
        nock("http://api.github.com").delete("/installation/token").reply(204).persist();

        // On branch deletion, `after` is all zeros and the workflow falls back
        // to checking out `before` for scripts too.
        const before = await getCommitHash();

        act.setEvent({
            before,
            after: ZEROS,
            created: false,
            deleted: true,
            ref: `refs/heads/${BRANCH}`,
        });

        const result = await act.runEvent("push", {
            logFile: process.env.ACT_LOG ? path.join(__dirname, "act-cleanup-delete.log") : undefined,
            mockApi: [
                ...appTokenMocks(moctokit),

                moctokit.rest.repos.listDeployments({
                    owner: "scality", repo: "sorbet", ref: "v1.2.2", per_page: 100,
                } as any).reply({
                    status: 200,
                    data: [{ id: 201, environment: `zenko/${BRANCH}@2.14` }],
                }),
                moctokit.rest.repos.createDeploymentStatus({
                    owner: "scality", repo: "sorbet", deployment_id: 201,
                    state: "inactive", description: "Superseded",
                }).reply({ status: 201, data: { id: 1 } }),

                moctokit.rest.repos.listDeployments({
                    owner: "scality", repo: "backbeat", ref: "9.3.0", per_page: 100,
                } as any).reply({ status: 200, data: [] }),
            ],
            mockSteps: stepPatches,
        });

        expect(findStep(result, "Inactivate prior deployments")?.status).toBe(0);
    });

    it("skips the cleanup job on branch creation", async () => {
        const after = await getCommitHash();

        act.setEvent({
            before: ZEROS,
            after,
            created: true,
            deleted: false,
            ref: `refs/heads/${BRANCH}`,
        });

        const result = await act.runEvent("push", {
            logFile: process.env.ACT_LOG ? path.join(__dirname, "act-cleanup-created.log") : undefined,
            mockApi: [],
        });

        // Job-level `if: !github.event.created` should skip everything
        expect(findStep(result, "Checkout scripts")).toBeUndefined();
        expect(findStep(result, "Parse component repos")).toBeUndefined();
        expect(findStep(result, "Inactivate prior deployments")).toBeUndefined();
    });

    it("does not call createDeploymentStatus when no deployments match the env prefix", async () => {
        nock("http://api.github.com").delete("/installation/token").reply(204).persist();

        const before = await getCommitHash("HEAD^");
        const after = await getCommitHash();

        act.setEvent({
            before,
            after,
            created: false,
            deleted: false,
            ref: `refs/heads/${BRANCH}`,
        });

        const result = await act.runEvent("push", {
            logFile: process.env.ACT_LOG ? path.join(__dirname, "act-cleanup-nomatch.log") : undefined,
            mockApi: [
                ...appTokenMocks(moctokit),

                // Sorbet: deployments exist at this ref, but for OTHER envs only
                moctokit.rest.repos.listDeployments({
                    owner: "scality", repo: "sorbet", ref: "v1.2.1", per_page: 100,
                } as any).reply({
                    status: 200,
                    data: [
                        { id: 301, environment: "zenko/development/2.14" },
                        { id: 302, environment: "zenko/improvement/OTHER-BRANCH@2.14" },
                    ],
                }),
                moctokit.rest.repos.listDeployments({
                    owner: "scality", repo: "backbeat", ref: "9.3.0", per_page: 100,
                } as any).reply({ status: 200, data: [] }),

                // No createDeploymentStatus registered — if the workflow calls it, the
                // mock returns 501 and the step surfaces an error.
            ],
            mockSteps: stepPatches,
        });

        expect(findStep(result, "Inactivate prior deployments")?.status).toBe(0);
    });
});
