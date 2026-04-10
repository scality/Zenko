import { Act } from "@kie/act-js";
import { MockGithub, Moctokit } from "@kie/mock-github";
import nock from "nock";
import path from "path";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";

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
let moctokit: Moctokit;
let act: Act;

async function getCommitHash(repo: string = "zenko") {
    const { stdout } = await exec("git -C " + github.repo.getPath(repo) + " rev-parse HEAD");
    return stdout.trim();
}

// Common deployment parameters expected for all components
const commonDeploymentParams = {
    environment: "zenko/development/2.11",
    description: "Zenko CI running",
    auto_merge: false,
    required_contexts: [],
    transient_environment: true,
    production_environment: false,
};

beforeEach(async () => {
    github = new MockGithub({
        repo: {
            zenko: {
                currentBranch: "improvement/ZENKO-5210",
                files: [
                    {
                        src: path.resolve(__dirname, "../..", ".github"),
                        dest: ".github",
                    },
                    {
                        src: path.resolve(__dirname, "test-deps.yaml"),
                        dest: "solution/deps.yaml",
                    },
                    {
                        src: path.resolve(__dirname, "test-create-component-deployments.yaml"),
                        dest: ".github/workflows/test-create-component-deployments.yaml",
                    },
                ],
            },
        },
    });
    await github.setup();

    moctokit = new Moctokit("http://api.github.com");

    act = new Act(github.repo.getPath("zenko"));
    act.setWorkflowFile(".github/workflows/test-create-component-deployments.yaml");

    act.setEnv("GITHUB_JOB", "test-deployments");
    act.setEnv("GITHUB_SHA", await getCommitHash());
    act.setEnv("GITHUB_REPOSITORY", "scality/zenko");
    act.setEnv("GITHUB_API_URL", "http://api.github.com");
    act.setEnv("GITHUB_RUN_ID", "1");
    act.setEnv("GITHUB_TOKEN", "fake-token");

    act.setSecret("APP_PRIVATE_KEY", TEST_PRIVATE_KEY);

    act.setPlatforms("ubuntu-24.04", "ghcr.io/catthehacker/ubuntu:act-24.04");
});

afterEach(async () => {
    nock.cleanAll();
    await github.teardown();
});

describe("create-component-deployments action", () => {
    it("should parse deps.yaml and create deployments on component repos", async () => {
        // Post-step: token revocation (DELETE /installation/token, not in Moctokit)
        nock("http://api.github.com").delete("/installation/token").reply(204).persist();

        const result = await act.runEvent("workflow_dispatch", {
            logFile: process.env.ACT_LOG ? path.join(__dirname, "act-deployments.log") : undefined,
            mockApi: [
                // Mock create-github-app-token: get installation then create token
                moctokit.rest.apps.getRepoInstallation().reply({
                    status: 200,
                    data: { id: 1, app_id: 12345, app_slug: "test-app" },
                    repeat: 5,
                }),
                moctokit.rest.apps.createInstallationAccessToken().reply({
                    status: 201,
                    data: { token: "ghs_fake_token" },
                    repeat: 5,
                }),

                // test-deps.yaml has 2 scality components (sorbet + backbeat)
                // kafka is scality/zenko (filtered as self-repo), redis has no scality registry
                // playground-sandbox has empty repo, manifest resolution will fail (non-fatal)

                // Sorbet: createDeployment + createDeploymentStatus
                moctokit.rest.repos.createDeployment({
                    owner: "scality",
                    repo: "sorbet",
                    ref: "v1.2.2",
                    ...commonDeploymentParams,
                }).reply({ status: 201, data: { id: 101 } }),

                moctokit.rest.repos.createDeploymentStatus({
                    owner: "scality",
                    repo: "sorbet",
                    deployment_id: 101,
                    state: "in_progress",
                    log_url: "https://github.com/scality/zenko/actions/runs/1",
                    description: "Zenko CI running",
                }).reply({ status: 201, data: { id: 1 } }),

                // Backbeat: createDeployment + createDeploymentStatus
                moctokit.rest.repos.createDeployment({
                    owner: "scality",
                    repo: "backbeat",
                    ref: "9.3.0",
                    ...commonDeploymentParams,
                }).reply({ status: 201, data: { id: 102 } }),

                moctokit.rest.repos.createDeploymentStatus({
                    owner: "scality",
                    repo: "backbeat",
                    deployment_id: 102,
                    state: "in_progress",
                    log_url: "https://github.com/scality/zenko/actions/runs/1",
                    description: "Zenko CI running",
                }).reply({ status: 201, data: { id: 2 } }),
            ],
            bind: true,
        });

        const parseStep = result.find(r => r.name?.includes("Parse component repos"));
        expect(parseStep).toBeDefined();
        expect(parseStep?.status).toBe(0);

        const deployStep = result.find(r => r.name?.includes("Create or update deployments"));
        expect(deployStep).toBeDefined();
        expect(deployStep?.status).toBe(0);
    });
});
