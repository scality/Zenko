import { Act, Mockapi } from "@kie/act-js";
import { MockGithub, Moctokit } from "@kie/mock-github";
import path from "path";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import assert from "assert";

const exec = promisify(execCb);

let github: MockGithub;
let mockapi: Mockapi;
let moctokit: Moctokit
let act: Act;

async function getCommitHash(repo: string = 'zenko') {
    const { stdout } = await exec('git -C ' + github.repo.getPath(repo) + ' rev-parse HEAD');
    return stdout.trim();
}

function withGitTag(tag: string, repo: string = 'zenko') {
    const f = async () => {
        await exec('git -C ' + github.repo.getPath(repo) + ' tag --no-sign -m test ' + tag);
    };
    f.toString = () => " and tag " + tag + " exists";
    return f;
}

function withArtifact(artifactsName: string) {
    const f = () => act.setInput("artifacts-name", artifactsName);
    f.toString = () => " and artifact " + artifactsName
    return f;
}

async function currentBranch(repo: string = 'zenko') {
    const { stdout } = await exec('git -C ' + github.repo.getPath(repo) + ' rev-parse --symbolic-full-name HEAD');
    return stdout.trim();
}

function withVersionFile(versionFile: string, repo: string = 'zenko') {
    const f = async () => {
        const targetVersionFile = github.repo.getPath(repo) + '/VERSION';

        // Commit the new VERSION file
        await exec('cp ' + path.resolve(__dirname, versionFile) + ' ' + targetVersionFile);
        await exec('git -C ' + github.repo.getPath(repo) + ' commit --no-sign -m "bump version" -- ' + targetVersionFile);

        // Update artifact name to match the new version
        act.setInput("artifacts-name", "github:scality:Zenko:staging-"+(await getCommitHash()).slice(0, 10)+".build-iso-and-end2end-test.3454");
    };
    f.toString = () => " and VERSION file is " + versionFile;
    return f;
}

beforeEach(async () => {
    github = new MockGithub({
        repo: {
            zenko: {
                currentBranch: "development/2.3",
                files: [
                    {
                        src: path.resolve(__dirname, "../..", ".github"),
                        dest: ".github",
                    },
                    {
                        src: path.resolve(__dirname, "VERSION-2.3.7-rc.1"),
                        dest: "VERSION",
                    }
                ],
            },
        },
    });
    await github.setup();

    mockapi = new Mockapi({
        artifacts: {
            baseUrl: "https://artifacts.scality.net",
            endpoints: {
                root: {
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
                },
            },
        },
    });

    moctokit = new Moctokit("http://api.github.com");

    act = new Act(github.repo.getPath("zenko"));
    act.setWorkflowFile('.github/workflows/release.yaml');
    act.setInput("artifacts-name", "github:scality:Zenko:staging-"+(await getCommitHash()).slice(0, 10)+".build-iso-and-end2end-test.3454");

    // Set secrets
    act.setSecret('ARTIFACTS_USER', 'foo');
    act.setSecret('ARTIFACTS_PASSWORD', 'bar');

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
});

const Pass = { toString: () => "pass", value: () => 0 };
const Fail = { toString: () => "fail", value: () => 1 };

test.each([
    ['Check if tag matches the branch name', Fail, '2.4.1', ''],
    ['Check if tag matches VERSION file', Fail, '2.3.7', ''],
    ['Check if tag matches VERSION file', Fail, '2.3.8', ''],
    ['Check if tag has not already been created', Fail, '2.3.7-rc.1', withGitTag('2.3.7-rc.1')],
    ['Promote artifacts', Fail, '2.3.7-rc.1', withArtifact('github:scality:Zenko:staging-ac5768a8c6.build-iso-and-end2end-test.3454')],
    ['Promote artifacts', Pass, '2.3.7-rc.1', ''],
    ['Promote artifacts', Pass, '2.3.7', withVersionFile("VERSION-2.3.7")],
])("%s should %s when version is %s%s", async (stepName, status, tag, ...configs) => {

    for(var c of configs.filter(c => !!c)) {
        assert(typeof c === 'function');
        await c();
    }

    act.setInput("tag", tag);

    const result = await act.runEvent("workflow_dispatch", {
        logFile: process.env.ACT_LOG ? "act-release-"+expect.getState().currentTestName+".log" : undefined,
        mockApi: [
            // Mock artifact promotion: copy, retrieve workflow run and set index
            mockapi.mock.artifacts.root
                .promote()
                .reply({ status: 200, data: "BUILD COPIED" }),
            moctokit.rest.actions
                .getWorkflowRun()
                .reply({ status: 200, data: { created_at: "2021-01-01T00:00:00Z" }, repeat: 2 }),
            mockapi.mock.artifacts.root
                .setIndex()
                .reply({ status: 200, data: "PASSED\n", repeat: 2 }),

            // Mock release creation: check existing release and create a new one
            moctokit.rest.repos
                .getReleaseByTag()
                .reply({ status: 404, data: {} }),
            moctokit.rest.repos
                .createRelease({
                    owner: "scality",
                    repo: "Zenko",
                    tag_name: tag,
                    target_commitish: await getCommitHash(),
                    generate_release_notes: true,
                    name: "Release " + tag,
                    body: "",
                    prerelease: tag === '2.3.7-rc.1',
                })
                .reply({ status: 201, data: {
                    id: 123,
                    upload_url: 'http://uploads.github.com/repos/scality/Zenko/releases/123/assets{?name,label}',
                    html_url: 'http://github.com/repos/scality/Zenko/releases/123',
                }}),
        ],
        mockSteps: {
            'verify-release': [{
                name: 'Fetch tags',
                mockWith: 'echo "tags fetched"'
            }],
            'release': [{
                // Need to explicitely pass token, the GITHUB_TOKEN does not seem to be set
                uses: 'softprops/action-gh-release@v2',
                mockWith: {
                    with: {
                        token: "my-token",
                    }
                }
            }],
            'promote': [{
                // Need to explicitely pass token, the GITHUB_TOKEN does not seem to be set
                uses: 'scality/action-artifacts@v4',
                mockWith: {
                    with: {
                        token: "my-token",
                    }
                }
            }],
        }
    });

    var lastResult = result[result.length - 1];
    var postSteps = [];

    // action-artifacts keep executing Post step, need to skip it...
    for (let i = result.length - 1; i >= 0; i--) {
        if (result[i].name.startsWith('Main ')) {
            lastResult = result[i];
            break;
        }
        postSteps.push(result[i]);
    }

    expect(lastResult.name).toStrictEqual('Main ' + stepName);
    expect(lastResult.status).toStrictEqual(status.value());
    postSteps.forEach(r => expect(r.status).toStrictEqual(Pass.value()));
})
