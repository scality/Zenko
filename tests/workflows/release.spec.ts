import { Act, Mockapi } from "@kie/act-js";
import { MockGithub, Moctokit } from "@kie/mock-github";
import path from "path";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import assert from "assert";
import nock from "nock";

const exec = promisify(execCb);

// Test-only RSA key (not used anywhere else, generated for act.js mock)
const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDSSu4ghRVAKyjX
c25FKdE+sARk3Jai8k8DCjJU/DMNskgNvGh7JPLDww98Ts9E3ddMNt06oBt5p8qc
YfaInUR0poPcJG6JbPWVEefNC00dTiHlXEGU8Ih8Dc2Ezf/zb45my9DmmGXeVScf
LNYtSSqxfqdjFIOvr8XJ8kuB7L3jyFTBN9xjfdTnmsJ0ilSatV50o6RdVjiZvf2r
z8uhlIw/b0xw8ZZ5rRXNr1VgDW7kcK952OYIDo9qvGMxOASjx9cpUJBkE/nrWF8I
HAGACAqUZJaF4p/CQFjd/7cmUpA+Shh31UdD/rSXzC1bTEB5vaJN8LyVEBYw+n19
iv6QO/K1AgMBAAECggEAaRNksd4dlK8cHK+CQU/YTGzx/R3VrPzLKxcsuBc+QVE8
PJTQVfvLy7JLKg9M9LmuStg9KX53zA1hqUsvvupqGqlbSKPxkXxep4pHW0aS1RpF
yI+U+2FGqUnST9II2q/6pPWhX591gybkQekK6ZzeFstUwyaseBwphbMqNHTBGy+F
9A52Zg42QBQbQoIsOiqpJTKxhDpdEx+AZqrG1EawQkygVeNyRnOaJgCgVTIxqk+m
lENCchKeZmo6aul/4LwH9GPDF+1ftMIlAwFXwQgp/IuzFmNf564NSIEZbWgYC8aN
gl3ZU5K6mrwbKpGg2HXPDb6AA0U4WN1Bmw8wLyWhjwKBgQDsgNSi4+kfjLJM9oHQ
PkNTfZ7rmrSdPf8gAodGsrABKz9IhfoCQJ0jNtegaGq3JB+YVJUUWtw4cnyBGOcE
f1F9JIRMcq885p9zwX0jDLLe1vR8305tmYJFweqAViwWQ2riy2IqupsWEhgKev1S
8QgSsaDcP1wksDWokykui85TzwKBgQDjoPOc1zs1teMG5zpSQVm3QT2C3ryRSBRo
+1jyszl8Rrm7x9IcmiyBL5XQOpHoNHH24wUDte+t08V/34mhEwaa3tl1MUmJLsBG
+LkTVXdRcFnHoqCbqFqYeV8eXQgY+Narq245VGGa1CfkhHvqQvuKVlIDLgPPrutg
czA0MpW+OwKBgQDU4ImFLTwzR8Nd/yyNst2LEzGuxIv6VUmFGIGHI2PFSZYmw2Fs
EZjfj4e7PQGBY6SEyu19auN6c6KZ2T5oD+nbiLkEzt3pJXU1Dl6C4/VFG5rpo17G
zDw0af2YEviP+ZMGHSd5aooZ7aNyG45Vz9sCaJxwYx+fbnR+DigtW24WhQKBgQCf
sPXXTWO7jYvk9ukCddhT6NAXdN2Darbu446GTdgBaLi6lTfBWyPnyZNnjv93kPt2
wdNtxACOyWfgCtnKB8f1dGvIfLhjJko8QBfPCYF4v8IsfNoB+bz9BQEHEyswIbqw
msbsL1d+QGJwPcWVFkLTzTUiB/EijUuR0Z26sNY+qwKBgQDWDEEBjZ+63kttpp4c
EAyXAIwDT+KhVppmXvIAjVkqP6+I8yqUSCFjXMTT1Bubovqk6wAnpYdA559LgRjc
gfkN+TRRaIeVB9jxzFHszenX6CVswwBtwSj331N/87GnI7fF7/ZDmMKRSiRjIQyL
6c4hJmUD3bnLspBgcbLD33c7Dw==
-----END PRIVATE KEY-----`;

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
    f.toString = () => " and artifact " + artifactsName;
    return f;
}

function withoutArtifact() {
    const f = () => act.deleteInput("artifacts-name");
    f.toString = () => " and no artifact";
    return f;
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
                    },
                    {
                        src: path.resolve(__dirname, "test-deps-base.yaml"),
                        dest: "solution/deps.yaml",
                    },
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

test.each([
    ['Check if tag matches the branch name', Fail, '2.4.1', ''],
    ['Check if tag matches the branch name', Fail, '2.3.7.1', ''],
    ['Check if tag matches the branch name', Fail, '2.3.7-1', ''],
    ['Check if tag matches VERSION file', Fail, '2.3.7', ''],
    ['Check if tag matches VERSION file', Fail, '2.3.8', ''],
    ['Check if tag matches VERSION file', Fail, '2.3.7-1', withBranch("hotfix/2.3.7")],
    ['Check if tag has not already been created', Fail, '2.3.7-rc.1', withGitTag('2.3.7-rc.1')],
    ['Check if tag has not already been created', Fail, '2.3.7-1', withBranch("hotfix/2.3.7"), withVersionFile("VERSION-2.3.7-1"), withGitTag('2.3.7-1')],
    ['Promote artifacts', Fail, '2.3.7-rc.1', withArtifact('github:scality:Zenko:staging-ac5768a8c6.build-iso-and-end2end-test.3454')],
    ['Promote artifacts', Pass, '2.3.7-rc.1', ''],
    ['Promote artifacts', Pass, '2.3.7', withVersionFile("VERSION-2.3.7")],
    ['Promote artifacts', Pass, '2.3.7-rc.1', withoutArtifact()],
    ['Promote artifacts', Pass, '2.3.7-1', withBranch("hotfix/2.3.7"), withVersionFile("VERSION-2.3.7-1")],
])("%s should %s when version is %s%s", async (stepName, status, tag, ...configs) => {

    for(var c of configs.filter(c => !!c)) {
        assert(typeof c === 'function');
        await c();
    }

    act.setInput("tag", tag);

    // Post-step: create-github-app-token revokes token via DELETE /installation/token,
    // which cannot be matched by moctokit.rest.apps.revokeInstallationAccessToken()
    nock('http://api.github.com').delete('/installation/token').reply(204).persist();

    const result = await act.runEvent("workflow_dispatch", {
        logFile: process.env.ACT_LOG
            ? "act-release-" + expect.getState().currentTestName!.replace(/[ /]/g, '_') + ".log"
            : undefined,
        verbose: process.env.ACT_VERBOSE ? true : false,
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

            // Mock automatic artifact discovery
            moctokit.rest.actions
                .listWorkflowRuns()
                .reply({
                    status: 200,
                    data: {
                        total_count: 1,
                        workflow_runs: [{
                            id: 1234,
                            conclusion: "success",
                            head_branch: "development/2.3",
                            head_sha: await getCommitHash(),
                            name: "build-iso-and-end2end-test",
                            run_number: 3454,
                            status: "completed",
                        }],
                    }
                }),

            // Mock release notes generation
            moctokit.rest.repos
                .listReleases()
                // First call from release notes generation, to get the previous release
                .reply({ status: 200, data: [{ tag_name: '2.3.6', id: 122 }] })
                // Second call from release notes generation, to get the previous release
                .reply({ status: 200, data: [{ tag_name: '2.3.6', id: 122 }] })
                // Third call made by action-gh-release@v2.5.2+ (after release creation) to handle
                // race condition when release is created by multiple jobs in parallel...
                .reply({
                    status: 200, data: [{ tag_name: '2.3.6', id: 122 }, {
                        id: 123,
                        draft: true,
                        name: `Release ${tag}`,
                        prerelease: tag === '2.3.7-rc.1',
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

            // Mock release creation: check existing release and create a new one
            moctokit.rest.repos
                .getReleaseByTag()
                .reply({ status: 404, data: {} }),
            moctokit.rest.repos
                .createRelease({
                    owner: 'scality',
                    repo: 'Zenko',
                    tag_name: tag,
                    target_commitish: await getCommitHash(),
                    generate_release_notes: false,
                    name: `Release ${tag}`,
                    body: 'something changed',
                    prerelease: tag === '2.3.7-rc.1',
                    draft: true,
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
            'verify-release': [{
                name: 'Fetch tags',
                mockWith: 'echo "tags fetched"'
            }, {
                // Need to explicitely pass token, the GITHUB_TOKEN does not seem to be set
                uses: 'actions/github-script@v7',
                mockWith: {
                    with: {
                        'github-token': "my-token",
                    }
                }
            }],
            'release': [{
                // Need to explicitely pass token, the GITHUB_TOKEN does not seem to be set
                uses: 'softprops/action-gh-release@v2.5.0',
                mockWith: {
                    with: {
                        token: "my-token",
                    }
                }
            }, {
                // Need to explicitely pass token, the GITHUB_TOKEN does not seem to be set
                uses: 'actions/github-script@v7',
                mockWith: {
                    with: {
                        'github-token': "my-token",
                    }
                }
            }],
            'create-deployments': [{
                name: 'Create release deployments',
                mockWith: {
                    with: {
                        'github-token': "my-token",
                    },
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
