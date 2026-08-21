import { Act, Mockapi } from "@kie/act-js";
import { MockGithub, Moctokit } from "@kie/mock-github";
import path from "path";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import assert from "assert";
import nock from "nock";
import { TEST_PRIVATE_KEY } from "./fixtures/test-private-key";

const exec = promisify(execCb);

let github: MockGithub;
let mockapi: Mockapi;
let moctokit: Moctokit
let act: Act;

async function getCommitHash(repo: string = 'zenko') {
    const { stdout } = await exec('git -C ' + github.repo.getPath(repo) + ' rev-parse HEAD');
    return stdout.trim();
}

async function currentBranch(repo: string = 'zenko') {
    const { stdout } = await exec('git -C ' + github.repo.getPath(repo) + ' rev-parse --symbolic-full-name HEAD');
    return stdout.trim();
}

function withBranch(branchName: string, repo: string = 'zenko') {
    const f = async () => {
        await exec('git -C ' + github.repo.getPath(repo) + ' checkout -B ' + branchName);
        act.setEnv('GITHUB_REF', 'refs/heads/' + branchName);
    };
    f.toString = () => " and branch " + branchName;
    return f;
}

// Simulate two releases racing on the same branch: both compute the same version, and
// the other one creates the tag while this run is still validating. Injected as an extra
// step, right after this run computed its version. Lightweight tag on purpose: it needs
// no committer identity nor signing key.
let racingTag: string | undefined;

function withRacingTag(tag: string) {
    const f = () => { racingTag = tag; };
    f.toString = () => " and tag " + tag + " is created concurrently";
    return f;
}

beforeEach(async () => {
    racingTag = undefined;

    github = new MockGithub({
        repo: {
            zenko: {
                currentBranch: "development/2.3",
                files: [
                    {
                        src: path.resolve(__dirname, "../..", ".github"),
                        dest: ".github",
                        // Exclude the real build-iso.yaml so the stub below replaces it.
                        // MockGithub.copyFiles runs in parallel, so without this filter
                        // the directory copy can race against and overwrite the stub.
                        filter: ["workflows/build-iso.yaml"],
                    },
                    {
                        // Stub the reusable build-iso workflow so tests don't actually build the ISO.
                        // act-js's mockSteps can't reach into reusable workflows (uses:).
                        src: path.resolve(__dirname, "resources/build-iso-stub.yaml"),
                        dest: ".github/workflows/build-iso.yaml",
                    },
                    {
                        src: path.resolve(__dirname, "../..", "version.sh"),
                        dest: "version.sh",
                    },
                    {
                        src: path.resolve(__dirname, "fixtures/test-deps-base.yaml"),
                        dest: "solution/deps.yaml",
                    },
                ],
            },
        },
    });
    await github.setup();

    // Seed tags so version.sh can compute predictable next versions:
    //   on development/2.3 with 2.3.6 tag, --release -> 2.3.7
    await exec('git -C ' + github.repo.getPath('zenko') + ' tag --no-sign -m test 2.3.6');

    mockapi = new Mockapi({
        artifacts: {
            baseUrl: "https://artifacts.scality.net",
            endpoints: {
                root: {
                    upload: {
                        path: '/upload/{name}/{artifactsPath}',
                        method: "put",
                        parameters: {
                            query: [],
                            path: ['name', 'artifactsPath'],
                            body: [],
                        },
                    },
                    promote: {
                        path: "/copy/{from}/{to}",
                        method: "get",
                        parameters: {
                            query: [],
                            path: ['from', 'to'],
                            body: [],
                        },
                    },
                    setIndex: {
                        path: '/add_metadata/github/{owner}/{repo}/{workflow}/{createdAt}/{name}',
                        method: "get",
                        parameters: {
                            query: [],
                            path: ['owner', 'repo', 'workflow', 'createdAt', 'name'],
                            body: [],
                        },
                    },
                    // action-artifacts@v4 (>=4.3.0) probes these two endpoints before
                    // uploading to detect presigned/multipart S3 upload support. A 404
                    // means "unsupported", so the action falls back to the direct
                    // PUT /upload/... path mocked above.
                    presignUpload: {
                        path: "/presign-upload/{name}/{file}",
                        method: "get",
                        parameters: {
                            query: [],
                            path: ["name", "file"],
                            body: [],
                        },
                    },
                    presignUploadPart: {
                        path: "/presign-upload-part/{name}/{file}",
                        method: "get",
                        parameters: {
                            query: [],
                            path: ["name", "file"],
                            body: [],
                        },
                    },
                },
            },
        },
    });

    moctokit = new Moctokit("http://api.github.com");

    act = new Act(github.repo.getPath("zenko"));
    act.setWorkflowFile('.github/workflows/release.yaml');

    // Add additional supported platform, as it is not yet automatically setup by act-js
    act.setPlatforms('ubuntu-24.04', 'ghcr.io/catthehacker/ubuntu:act-24.04')

    // Set secrets
    act.setSecret('ARTIFACTS_USER', 'foo');
    act.setSecret('ARTIFACTS_PASSWORD', 'bar');
    act.setSecret('ACTIONS_APP_PRIVATE_KEY', TEST_PRIVATE_KEY);

    // Set variables (repository variables)
    act.setVar('ACTIONS_APP_ID', '123456');

     // For some reason, the GITHUB_REF is not set to the current branch where `act` is executed: so
     // we need to explicitely set it to the current branch
    act.setEnv('GITHUB_REF', await currentBranch());

    // Need to setup the GITHUB_API_URL to the mock server
    act.setEnv("GITHUB_API_URL", "http://api.github.com");

    // Set to current repository
    act.setEnv("GITHUB_REPOSITORY", "scality/Zenko");
});

afterEach(async () => {
    await github.teardown();
    nock.cleanAll();
});

const Pass = { toString: () => "pass", value: () => 0 };
const Fail = { toString: () => "fail", value: () => 1 };

// Each test case: (step expected to be last, expected status, release type, branch+tag setup)
// The computed version is determined by the seeded tags + release type:
//   development/2.3 + 2.3.6 tag:
//     --release -> 2.3.7
//     --preview -> 2.3.7-preview.1
//     --rc      -> 2.3.7-rc.1
//   hotfix/2.3.6:
//     --release -> 2.3.6-1
//     --rc      -> 2.3.6-1-rc.1
// A non-empty `tag` sets the workflow_dispatch `tag` input and exercises the
// second pass (build + release + promote). An empty `tag` leaves the input
// unset and exercises the first pass, which either fails in verify-release
// or (on success) fires the redispatch job.
test.each([
    ['Promote artifacts', Pass, 'release', '2.3.7', ''],
    ['Promote artifacts', Pass, 'rc', '2.3.7-rc.1', ''],
    ['Promote artifacts', Pass, 'preview', '2.3.7-preview.1', ''],
    ['Promote artifacts', Pass, 'release', '2.3.6-1', withBranch('hotfix/2.3.6')],
    ['Promote artifacts', Pass, 'rc', '2.3.6-1-rc.1', withBranch('hotfix/2.3.6')],
    ['Compute version', Fail, 'release', '2.3.7', withBranch('improvement/ZENKO-1234')],
    ['Check if tag matches the branch name', Fail, 'release', '2.3.7', withBranch('q/2.3')],
    ['Check if tag has not already been created', Fail, 'release', '2.3.7', withRacingTag('2.3.7')],
    // The following tests exercise the first pass (compute version + re-trigger)
    ['Trigger release with computed tag', Pass, 'release', '', ''],
    ['Compute version', Fail, 'release', '', withBranch('improvement/ZENKO-1234')],
    ['Check if tag matches the branch name', Fail, 'release', '', withBranch('q/2.3')],
    ['Check if tag has not already been created', Fail, 'release', '', withRacingTag('2.3.7')],
])("%s should %s when making %s %s%s", async (stepName, status, type, tag, ...configs) => {

    for(var c of configs.filter(c => !!c)) {
        assert(typeof c === 'function');
        await c();
    }

    act.setInput("type", type as string);
    if (tag) {
        act.setInput("tag", tag as string);
    }

    const prerelease = type !== 'release';

    // Post-step: create-github-app-token revokes token via DELETE /installation/token,
    // which cannot be matched by moctokit.rest.apps.revokeInstallationAccessToken()
    nock('http://api.github.com').delete('/installation/token').reply(204).persist();

    const result = await act.runEvent("workflow_dispatch", {
        logFile: process.env.ACT_LOG
            ? "act-release-" + expect.getState().currentTestName!.replace(/[^\w.-]/g, '_') + ".log"
            : undefined,
        verbose: process.env.ACT_VERBOSE ? true : false,
        mockApi: [
            // Mock artifact upload (stub build-iso PUTs a placeholder file)
            mockapi.mock.artifacts.root
                .upload()
                .reply({ status: 200, data: "OK" }),

            // Redispatch (first pass only): trigger-release triggers the second pass.
            moctokit.rest.actions
                .createWorkflowDispatch({
                    owner: 'scality',
                    repo: 'Zenko',
                    workflow_id: 'release.yaml',
                    ref: await currentBranch(),
                    inputs: { type, tag: tag || '2.3.7' },
                } as any)
                .reply({ status: 204, data: {} } as any),

            // Mock artifact promotion: copy + set index
            mockapi.mock.artifacts.root
                .promote()
                .reply({ status: 200, data: "BUILD COPIED" }),
            // Presign/multipart capability probes (action-artifacts >=4.3.0): 404 => direct upload
            mockapi.mock.artifacts.root.presignUpload().reply({ status: 404, data: {}, repeat: 10 }),
            mockapi.mock.artifacts.root.presignUploadPart().reply({ status: 404, data: {}, repeat: 10 }),

            // Each action-artifacts invocation runs a post-step (setDefaultIndex)
            // that calls setIndex twice (metadata + actionsMetadata), and each
            // setIndex calls getWorkflowRun. With 2 invocations (upload + promote)
            // that's 4 calls to each.
            moctokit.rest.actions
                .getWorkflowRun()
                .reply({ status: 200, data: { created_at: "2021-01-01T00:00:00Z" }, repeat: 4 }),
            mockapi.mock.artifacts.root
                .setIndex()
                .reply({ status: 200, data: "PASSED\n", repeat: 4 }),

            // Mock release lookup by tag used by action-gh-release@v3.
            // IMPORTANT: register these BEFORE listReleases — moctokit translates the
            // unparameterized `listReleases()` path to the regex `/repos/.+/.+/releases`
            // (unanchored), which also matches getReleaseByTag URLs and would hijack them.
            // v3 calls getReleaseByTag twice: once upfront (findTagFromReleases → 404)
            // and once after creation (canonicalizeCreatedRelease).
            moctokit.rest.repos
                .getReleaseByTag({ tag, owner: 'scality', repo: 'Zenko' })
                .reply({ status: 404, data: {} })
                .reply({
                    status: 200, data: {
                        id: 123,
                        draft: true,
                        assets: [],
                        name: `Release ${tag}`,
                        prerelease,
                        tag_name: tag,
                        target_commitish: await getCommitHash(),
                        upload_url: 'http://uploads.github.com/repos/scality/Zenko/releases/456/assets{?name,label}',
                        html_url: 'http://github.com/repos/scality/Zenko/releases/456',
                    },
                }),

            // Mock release notes generation
            moctokit.rest.repos
                .listReleases({ owner: 'scality', repo: 'Zenko' } as any)
                // First call from release notes generation, to get the previous release
                .reply({ status: 200, data: [{ tag_name: '2.3.6', id: 122 }] })
                // Next three calls from action-gh-release@v3's findTagFromReleases, which lists
                // releases after getReleaseByTag returns 404 (retrying maxRetries=3 times);
                // none may contain the target tag, or v3 updates instead of creating.
                .reply({ status: 200, data: [{ tag_name: '2.3.6', id: 122 }], repeat: 3 })
                // Last call made by action-gh-release@v3's canonicalizeCreatedRelease
                // (recentReleasesByTag scans allReleases to reconcile duplicate drafts).
                .reply({
                    status: 200, data: [{ tag_name: '2.3.6', id: 122 }, {
                        id: 123,
                        draft: true,
                        assets: [],
                        name: `Release ${tag}`,
                        prerelease,
                        tag_name: tag,
                        target_commitish: await getCommitHash(),
                        upload_url: 'http://uploads.github.com/repos/scality/Zenko/releases/456/assets{?name,label}',
                        html_url: 'http://github.com/repos/scality/Zenko/releases/456',
                    }],
                }),
            moctokit.rest.repos
                .generateReleaseNotes({
                    owner: 'scality',
                    repo: 'Zenko',
                    previous_tag_name: '2.3.6',
                    tag_name: tag,
                    target_commitish: await getCommitHash(),
                })
                .reply({ status: 200, data: { body: 'something changed' } }),
            moctokit.rest.repos
                .createRelease({
                    owner: 'scality',
                    repo: 'Zenko',
                    tag_name: tag,
                    target_commitish: await getCommitHash(),
                    generate_release_notes: false,
                    name: `Release ${tag}`,
                    body: 'something changed',
                    prerelease,
                    draft: !prerelease,  // v3 only sets drafts for non-prereleases
                })
                .reply({ status: 201, data: {
                    id: 123,
                    upload_url: 'http://uploads.github.com/repos/scality/Zenko/releases/456/assets{?name,label}',
                    html_url: 'http://github.com/repos/scality/Zenko/releases/456',
                }}),
            moctokit.rest.repos
                .updateRelease({
                    owner: 'scality',
                    repo: 'Zenko',
                    draft: false,
                    release_id: 123,
                })
                .reply({ status: 200, data: {
                    id: 123,
                    upload_url: 'http://uploads.github.com/repos/scality/Zenko/releases/456/assets{?name,label}',
                    html_url: 'http://github.com/repos/scality/Zenko/releases/456',
                }}),

            // Mock create-github-app-token
            moctokit.rest.apps
                .listInstallations()
                .reply({ status: 200, data: [] }),
            moctokit.rest.apps
                .getRepoInstallation({ owner: 'scality', repo: 'sorbet' })
                .reply({ status: 200, data: { id: 4242, app_slug: 'scality-test-app' } }),
            moctokit.rest.apps
                .createInstallationAccessToken({ installation_id: 4242 })
                .reply({ status: 201, data: { token: 'my-app-token' } }),

            // Mock deployment creation for sorbet
            moctokit.rest.repos
                .listDeployments({
                    owner: 'scality', repo: 'sorbet', environment: `zenko/${tag}`, ref: 'v1.2.1', per_page: 1,
                } as any)
                .reply({ status: 200, data: [] }),
            moctokit.rest.repos
                .createDeployment({ owner: 'scality', repo: 'sorbet' })
                .reply({ status: 201, data: { id: 1001 } }),
            moctokit.rest.repos
                .createDeploymentStatus({ owner: 'scality', repo: 'sorbet', deployment_id: 1001 })
                .reply({ status: 201, data: {} }),

            // Mock deployment creation for backbeat
            moctokit.rest.repos
                .listDeployments({
                    owner: 'scality', repo: 'backbeat', environment: `zenko/${tag}`, ref: '9.3.0', per_page: 1,
                } as any)
                .reply({ status: 200, data: [] }),
            moctokit.rest.repos
                .createDeployment({ owner: 'scality', repo: 'backbeat' })
                .reply({ status: 201, data: { id: 1002 } }),
            moctokit.rest.repos
                .createDeploymentStatus({ owner: 'scality', repo: 'backbeat', deployment_id: 1002 })
                .reply({ status: 201, data: {} }),
        ],
        mockSteps: {
            ...(racingTag ? {
                'verify-release': [{
                    after: 'Compute version',
                    mockWith: {
                        name: 'Concurrent release creates the tag',
                        run: 'git tag --no-sign ' + racingTag,
                    },
                }],
            } : {}),
            'trigger-release': [{
                // Need to explicitely pass token, the GITHUB_TOKEN does not seem to be set
                uses: 'actions/github-script@v7',
                mockWith: {
                    with: {
                        'github-token': "my-token",
                    },
                },
            }],
            'update-artifact-status': [{
                // upload_final_status@1.17.0 wraps action-artifacts@v4 in a
                // composite that doesn't forward `token:`, so its nested
                // post-step (setDefaultIndex) can't authenticate. Thus we
                // neutralize the step with `if: false` instead.
                uses: 'scality/actions/upload_final_status@1.17.0',
                mockWith: {
                    if: 'false',
                },
            }],
            'release': [{
                // Need to explicitely pass token, the GITHUB_TOKEN does not seem to be set
                uses: 'softprops/action-gh-release@v3',
                mockWith: {
                    with: {
                        token: "my-token",
                    },
                },
            }, {
                // Need to explicitely pass token, the GITHUB_TOKEN does not seem to be set
                uses: 'actions/github-script@v7',
                mockWith: {
                    with: {
                        'github-token': "my-token",
                    },
                },
            }],
            'create-deployments': [{
                name: 'Create release deployments',
                mockWith: {
                    with: {
                        'github-token': "my-token",
                    },
                },
            }],
            'promote': [{
                // Need to explicitely pass token, the GITHUB_TOKEN does not seem to be set
                uses: 'scality/action-artifacts@v4',
                mockWith: {
                    with: {
                        token: "my-token",
                    },
                },
            }],
        },
    });

    // act >=0.2.81 appends a timing suffix to success/failure lines ("Main foo [40ms]"), which
    // act-js's OutputParser splits into a named "Run" entry followed by an unnamed status entry.
    // So the real status of result[i] lives on result[i + 1]; unnamed entries have status set.
    var lastResult = result.length - 2;
    var postSteps: number[] = [];

    // action-artifacts keep executing Post step, need to skip it...
    for (let i = result.length - 1; i >= 0; i--) {
        if (!result[i].name) {
            postSteps.push(result[i].status);
        } else if (result[i].name.startsWith('Main ')) {
            lastResult = i;
            break;
        }
    }

    postSteps.pop(); // last pushed entry is the matched step's own status, not a post-step

    // Dump the whole result list on failure so CI failures can be debugged from the log.
    if (!result[lastResult].name.startsWith('Main ' + stepName)) {
        console.error(
            'expected Main ' + stepName + ', got ' + result[lastResult].name + '\nresult:\n'
            + JSON.stringify(result.map(r => ({ name: r.name, status: r.status })), null, 2),
        );
    }

    expect(result[lastResult].name.startsWith('Main ' + stepName)).toBe(true);
    expect(result[lastResult + 1].status).toStrictEqual(status.value());
    postSteps.forEach(s => expect(s).toStrictEqual(Pass.value()));
})
