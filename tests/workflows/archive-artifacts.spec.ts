import { Act, Mockapi } from "@kie/act-js";
import { MockGithub, Moctokit } from "@kie/mock-github";
import path from "path";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const exec = promisify(execCb);

let github: MockGithub;
let mockapi: Mockapi;
let moctokit: Moctokit;
let act: Act;

function createJUnitReport(
    name: string,
    tests: number,
    failures: number = 0,
    errors: number = 0,
    skipped: number = 0,
): string {
    const testcases = [];
    for (let i = 0; i < tests - failures - errors - skipped; i++)
        testcases.push(`    <testcase name="test_pass_${i}" classname="${name}" time="0.1" />`);
    for (let i = 0; i < failures; i++)
        testcases.push(`    <testcase name="test_fail_${i}" classname="${name}" time="0.2">\n      <failure message="assertion">expected</failure>\n    </testcase>`);
    for (let i = 0; i < errors; i++)
        testcases.push(`    <testcase name="test_error_${i}" classname="${name}" time="0.15">\n      <error message="runtime">bang</error>\n    </testcase>`);
    for (let i = 0; i < skipped; i++)
        testcases.push(`    <testcase name="test_skip_${i}" classname="${name}" time="0">\n      <skipped />\n    </testcase>`);

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="${tests}" failures="${failures}" errors="${errors}" skipped="${skipped}">
  <testsuite name="${name}" package="pkg" tests="${tests}" failures="${failures}" errors="${errors}" skipped="${skipped}">
${testcases.join("\n")}
  </testsuite>
</testsuites>
`;
}

async function getCommitHash(repo: string = "zenko") {
    const { stdout } = await exec("git -C " + github.repo.getPath(repo) + " rev-parse HEAD");
    return stdout.trim();
}

beforeEach(async () => {
    github = new MockGithub({
        repo: {
            zenko: {
                currentBranch: "development/2.14",
                files: [
                    {
                        src: path.resolve(__dirname, "../..", ".github"),
                        dest: ".github",
                    },
                    {
                        src: path.resolve(__dirname, "test-archive-artifacts.yaml"),
                        dest: ".github/workflows/test-archive-artifacts.yaml",
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
                    listReports: {
                        path: "/builds/{artifact}/data/test-archive.{attempt}/reports/?format=txt",
                        method: "get",
                        parameters: {
                            query: [],
                            path: ["artifact", "attempt"],
                            body: [],
                        },
                    },
                    downloadReport: {
                        path: "/builds/{artifact}/data/test-archive.{attempt}/reports/{filename}",
                        method: "get",
                        parameters: {
                            query: [],
                            path: ["artifact", "attempt", "filename"],
                            body: [],
                        },
                    },
                    uploadReport: {
                        path: "/upload/{artifact}/data/test-archive.{attempt}/reports/{report}",
                        method: "put",
                        parameters: {
                            query: [],
                            path: ["artifact", "attempt", "report"],
                            body: [],
                        },
                    },
                    uploadMergedReport: {
                        path: "/upload/{artifact}/data/test-archive.{attempt}/junit-merged.xml",
                        method: "put",
                        parameters: {
                            query: [],
                            path: ["artifact", "attempt"],
                            body: [],
                        },
                    },
                    uploadKindLogs: {
                        path: "/upload/{artifact}/data/test-archive.{attempt}/kind-logs/{file}",
                        method: "put",
                        parameters: {
                            query: [],
                            path: ["artifact", "attempt", "file"],
                            body: [],
                        },
                    },
                    uploadLogsArchive: {
                        path: "/upload/{artifact}/{file}",
                        method: "put",
                        parameters: {
                            query: [],
                            path: ["artifact", "file"],
                            body: [],
                        },
                    },
                    // action-artifacts@v4 GETs /version/2/{name}/{file} before uploading
                    // when run_attempt != 1; response body must end with 'PASSED\n'.
                    versionFile: {
                        path: "/version/2/{artifact}/{file}",
                        method: "get",
                        parameters: {
                            query: [],
                            path: ["artifact", "file"],
                            body: [],
                        },
                    },
                },
            },
        },
    });

    moctokit = new Moctokit("http://api.github.com");

    act = new Act(github.repo.getPath("zenko"));
    act.setWorkflowFile(".github/workflows/test-archive-artifacts.yaml");

    act.setEnv("GITHUB_JOB", "test-archive");
    act.setEnv("GITHUB_RUN_ATTEMPT", "1");
    act.setEnv("GITHUB_SHA", await getCommitHash());
    act.setEnv("GITHUB_REPOSITORY", "scality/zenko");
    act.setEnv("GITHUB_API_URL", "http://api.github.com");
    act.setEnv("GITHUB_RUN_ID", "1");
    act.setSecret("GITHUB_TOKEN", "fake");

    act.setPlatforms("ubuntu-24.04", "ghcr.io/catthehacker/ubuntu:act-24.04");
});

afterEach(async () => {
    await github.teardown();
});

/** Common mock APIs needed by every test: artifacts service + GitHub checks API. */
function commonMockApi(...extraMocks: any[]) {
    return [
        // GitHub Checks API used by mikepenz/action-junit-report
        moctokit.rest.checks.create().reply({ status: 201, data: { id: 1 }, repeat: 10 }),
        moctokit.rest.checks.update().reply({ status: 200, data: { id: 1 }, repeat: 10 }),
        moctokit.rest.checks.listForRef().reply({ status: 200, data: { total_count: 0, check_runs: [] }, repeat: 10 }),
        // GitHub Actions run API used by mikepenz/action-junit-report
        moctokit.rest.actions.getWorkflowRun().reply({
            status: 200,
            data: { id: 1, status: "completed", conclusion: "success", head_sha: "abc", html_url: "https://github.com" },
            repeat: 10,
        }),
        mockapi.mock.artifacts.root.uploadKindLogs().reply({ status: 200, data: {}, repeat: 10 }),
        mockapi.mock.artifacts.root.uploadMergedReport().reply({ status: 200, data: {}, repeat: 10 }),
        mockapi.mock.artifacts.root.uploadLogsArchive().reply({ status: 200, data: {}, repeat: 10 }),
        ...extraMocks,
    ];
}

/**
 * act >=0.2.81 appends a timing suffix to success/failure lines, which
 * act-js splits into a named entry followed by an unnamed status entry.
 * The real status of result[i] lives on result[i + 1].
 */
function findStep(result: { name: string; status: number }[], nameFragment: string) {
    const idx = result.findIndex(r => r.name?.includes(nameFragment));
    if (idx < 0) {
        return undefined;
    }

    expect(result.length).toBeGreaterThan(idx + 1);
    expect(result[idx + 1].name).not.toBeDefined();
    expect(result[idx + 1].status).toBeDefined();
    if (result.length > idx + 2) {
        expect(result[idx + 2].name).toBeDefined();
    }

    return { name: result[idx].name, status: result[idx + 1]?.status };
}

describe("archive-artifacts action", () => {
    describe("reporting logic", () => {
        it("should merge a single test report", async () => {
            const repoPath = github.repo.getPath("zenko")!;
            mkdirSync(path.join(repoPath, "artifacts/data/reports"), { recursive: true });
            writeFileSync(path.join(repoPath, "artifacts/data/reports/test.xml"), createJUnitReport("Suite", 5));

            const result = await act.runEvent("workflow_dispatch", {
                logFile: process.env.ACT_LOG ? path.join(__dirname, "act-archive-single.log") : undefined,
                mockApi: commonMockApi(
                    mockapi.mock.artifacts.root.uploadReport({ report: "test.xml" }).reply({ status: 200, data: {} }),
                ),
                bind: true,
            });

            expect(findStep(result, "Main Merge JUnit reports")?.status).toBe(0);
        });

        it("should merge multiple test reports", async () => {
            const repoPath = github.repo.getPath("zenko")!;
            const dir = path.join(repoPath, "artifacts/data/reports");
            mkdirSync(dir, { recursive: true });
            writeFileSync(path.join(dir, "a.xml"), createJUnitReport("SuiteA", 5, 1));
            writeFileSync(path.join(dir, "b.xml"), createJUnitReport("SuiteB", 3, 0, 1));

            const result = await act.runEvent("workflow_dispatch", {
                logFile: process.env.ACT_LOG ? path.join(__dirname, "act-archive-multiple.log") : undefined,
                mockApi: commonMockApi(
                    mockapi.mock.artifacts.root.uploadReport({ report: "a.xml" }).reply({ status: 200, data: {} }),
                    mockapi.mock.artifacts.root.uploadReport({ report: "b.xml" }).reply({ status: 200, data: {} }),
                ),
                bind: true,
            });

            expect(findStep(result, "Main Merge JUnit reports")?.status).toBe(0);
        });

        it("should report failures", async () => {
            const repoPath = github.repo.getPath("zenko")!;
            mkdirSync(path.join(repoPath, "artifacts/data/reports"), { recursive: true });
            writeFileSync(
                path.join(repoPath, "artifacts/data/reports/test.xml"),
                createJUnitReport("Suite", 10, 2),
            );

            const result = await act.runEvent("workflow_dispatch", {
                logFile: process.env.ACT_LOG ? path.join(__dirname, "act-archive-failures.log") : undefined,
                mockApi: commonMockApi(
                    mockapi.mock.artifacts.root.uploadReport({ report: "test.xml" }).reply({ status: 200, data: {} }),
                ),
                bind: true,
            });

            expect(findStep(result, "Main Merge JUnit reports")?.status).toBe(0);
        });

        it("should download reports from previous attempt", async () => {
            act.setEnv("GITHUB_RUN_ATTEMPT", "2");

            const repoPath = github.repo.getPath("zenko")!;
            mkdirSync(path.join(repoPath, "artifacts/data/reports"), { recursive: true });
            writeFileSync(
                path.join(repoPath, "artifacts/data/reports/current.xml"),
                createJUnitReport("Suite", 3),
            );

            const result = await act.runEvent("workflow_dispatch", {
                logFile: process.env.ACT_LOG ? path.join(__dirname, "act-archive-retry.log") : undefined,
                mockApi: commonMockApi(
                    mockapi.mock.artifacts.root.listReports({ attempt: 1 }).reply({ status: 200, data: "prev.xml" }),
                    mockapi.mock.artifacts.root.downloadReport({ attempt: 1 }).reply({ status: 200, data: createJUnitReport("Suite", 5, 2) }),
                    mockapi.mock.artifacts.root.uploadReport({ report: "current.xml" }).reply({ status: 200, data: {} }),
                    mockapi.mock.artifacts.root.versionFile().reply({ status: 200, data: "PASSED\n", repeat: 20 }),
                ),
                bind: true,
            });

            expect(findStep(result, "Main Download previous JUnit reports")?.status).toBe(0);
            expect(findStep(result, "Main Merge JUnit reports")?.status).toBe(0);
        });

        it("should report errors", async () => {
            const repoPath = github.repo.getPath("zenko")!;
            mkdirSync(path.join(repoPath, "artifacts/data/reports"), { recursive: true });
            writeFileSync(
                path.join(repoPath, "artifacts/data/reports/test.xml"),
                createJUnitReport("Suite", 8, 0, 2),
            );

            const result = await act.runEvent("workflow_dispatch", {
                logFile: process.env.ACT_LOG ? path.join(__dirname, "act-archive-errors.log") : undefined,
                mockApi: commonMockApi(
                    mockapi.mock.artifacts.root.uploadReport({ report: "test.xml" }).reply({ status: 200, data: {} }),
                ),
                bind: true,
            });

            expect(findStep(result, "Main Merge JUnit reports")?.status).toBe(0);
        });

        it("should handle skipped tests", async () => {
            const repoPath = github.repo.getPath("zenko")!;
            const dir = path.join(repoPath, "artifacts/data/reports");
            mkdirSync(dir, { recursive: true });
            writeFileSync(path.join(dir, "a.xml"), createJUnitReport("Suite", 5, 0, 0, 1));
            writeFileSync(path.join(dir, "b.xml"), createJUnitReport("Suite", 4, 0, 0, 2));

            const result = await act.runEvent("workflow_dispatch", {
                logFile: process.env.ACT_LOG ? path.join(__dirname, "act-archive-skipped.log") : undefined,
                mockApi: commonMockApi(
                    mockapi.mock.artifacts.root.uploadReport({ report: "a.xml" }).reply({ status: 200, data: {} }),
                    mockapi.mock.artifacts.root.uploadReport({ report: "b.xml" }).reply({ status: 200, data: {} }),
                ),
                bind: true,
            });

            expect(findStep(result, "Main Merge JUnit reports")?.status).toBe(0);
        });
    });
});
