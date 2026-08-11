import { MockGithub } from "@kie/mock-github";
import path from "path";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execCb);

const SCRIPT = path.resolve(__dirname, "../..", "version.sh");

let github: MockGithub;
let repoPath: string;

async function git(args: string): Promise<string> {
    const { stdout } = await exec(`git -C "${repoPath}" ${args}`);
    return stdout.trim();
}

async function setupBranch(name: string) {
    await git(`checkout -B ${name}`);
}

async function commit(message: string) {
    await git(`commit --no-sign --allow-empty -m "${message}"`);
}

async function tag(name: string) {
    await git(`tag --no-sign -m test ${name}`);
}

interface VersionOutput {
    VERSION: string;
    VERSION_HOTFIX: string;
    VERSION_PRERELEASE: string;
    VERSION_SUFFIX: string;
    VERSION_FULL: string;
}

function parseOutput(stdout: string): VersionOutput {
    const result: Record<string, string> = {};
    for (const line of stdout.split("\n").filter(Boolean)) {
        const [name, value] = line.split("=", 2);
        result[name] = value.replace(/^'/, "").replace(/'$/, "");
    }
    return result as unknown as VersionOutput;
}

async function runScript(...args: string[]): Promise<VersionOutput> {
    const { stdout } = await exec(`${SCRIPT} ${args.join(" ")}`, { cwd: repoPath });
    return parseOutput(stdout);
}

async function runScriptError(...args: string[]): Promise<{ code: number; stderr: string }> {
    try {
        await exec(`${SCRIPT} ${args.join(" ")}`, { cwd: repoPath });
        return { code: 0, stderr: "" };
    } catch (err) {
        const e = err as { code: number; stderr: string };
        return { code: e.code, stderr: e.stderr };
    }
}

beforeEach(async () => {
    github = new MockGithub({ repo: { zenko: {} } });
    await github.setup();
    repoPath = github.repo.getPath("zenko") as string;
    await commit("initial");
});

afterEach(async () => {
    await github.teardown();
});

describe("version.sh on development/X.Y branch", () => {
    beforeEach(async () => {
        await setupBranch("development/2.3");
        for (const z of [0, 1, 2, 3, 4, 5]) {
            await commit(`2.3.${z}`);
            await tag(`2.3.${z}`);
        }
    });

    it("default mode -> next dev version", async () => {
        const out = await runScript();
        expect(out.VERSION).toBe("2.3.6");
        expect(out.VERSION_HOTFIX).toBe("");
        expect(out.VERSION_PRERELEASE).toBe("-dev");
        expect(out.VERSION_FULL).toBe("2.3.6-dev");
    });

    it("--release -> next release version", async () => {
        const out = await runScript("--release");
        expect(out.VERSION_FULL).toBe("2.3.6");
        expect(out.VERSION_PRERELEASE).toBe("");
    });

    it("--preview without prior previews -> preview.1", async () => {
        const out = await runScript("--preview");
        expect(out.VERSION_FULL).toBe("2.3.6-preview.1");
    });

    it("--preview with existing preview -> next preview", async () => {
        await tag("2.3.6-preview.1");
        await tag("2.3.6-preview.2");
        const out = await runScript("--preview");
        expect(out.VERSION_FULL).toBe("2.3.6-preview.3");
    });

    it("--rc -> rc.1", async () => {
        const out = await runScript("--rc");
        expect(out.VERSION_FULL).toBe("2.3.6-rc.1");
    });
});

describe("version.sh on q/X.Y branch", () => {
    it("behaves like development/X.Y", async () => {
        await setupBranch("q/2.5");
        await commit("2.5.0");
        await tag("2.5.0");
        const out = await runScript("--release");
        expect(out.VERSION_FULL).toBe("2.5.1");
    });
});

describe("version.sh on a new development/X.Y branch (no tags)", () => {
    beforeEach(async () => {
        await setupBranch("development/2.3");
    });

    it("default -> 2.3.0-dev", async () => {
        const out = await runScript();
        expect(out.VERSION_FULL).toBe("2.3.0-dev");
    });

    it("--release -> 2.3.0", async () => {
        const out = await runScript("--release");
        expect(out.VERSION_FULL).toBe("2.3.0");
    });
});

describe("version.sh on hotfix/X.Y.Z branch", () => {
    describe("with no prior hotfix tags", () => {
        beforeEach(async () => {
            await setupBranch("hotfix/2.3.5");
        });

        it("default -> N starts at 1", async () => {
            const out = await runScript();
            expect(out.VERSION).toBe("2.3.5");
            expect(out.VERSION_HOTFIX).toBe("-1");
            expect(out.VERSION_PRERELEASE).toBe("-dev");
            expect(out.VERSION_FULL).toBe("2.3.5-1-dev");
        });

        it("--release -> 2.3.5-1", async () => {
            const out = await runScript("--release");
            expect(out.VERSION_FULL).toBe("2.3.5-1");
            expect(out.VERSION_HOTFIX).toBe("-1");
            expect(out.VERSION_PRERELEASE).toBe("");
        });
    });

    describe("with existing hotfix tag 2.3.5-1", () => {
        beforeEach(async () => {
            await setupBranch("hotfix/2.3.5");
            await tag("2.3.5-1");
        });

        it("default -> 2.3.5-2-dev", async () => {
            const out = await runScript();
            expect(out.VERSION_FULL).toBe("2.3.5-2-dev");
        });

        it("--release -> 2.3.5-2", async () => {
            const out = await runScript("--release");
            expect(out.VERSION_FULL).toBe("2.3.5-2");
        });

        it("--preview -> 2.3.5-2-preview.1", async () => {
            const out = await runScript("--preview");
            expect(out.VERSION_FULL).toBe("2.3.5-2-preview.1");
        });

        it("--rc -> 2.3.5-2-rc.1", async () => {
            const out = await runScript("--rc");
            expect(out.VERSION_FULL).toBe("2.3.5-2-rc.1");
        });

        it("exports allow deriving the 4-digit dot form", async () => {
            const out = await runScript("--release");
            // ${VERSION}${VERSION_HOTFIX/-/.} → "2.3.5.2"
            const dotForm = out.VERSION + out.VERSION_HOTFIX.replace("-", ".");
            expect(dotForm).toBe("2.3.5.2");
        });
    });
});

describe("version.sh on a feature/PR branch", () => {
    beforeEach(async () => {
        await setupBranch("development/2.3");
        await commit("base");
        await tag("2.3.0");
        await git("push origin development/2.3");
        await git("checkout -b improvement/ZENKO-1234");
        await commit("feature work");
    });

    it("default -> resolves base branch and uses -dev", async () => {
        const out = await runScript();
        expect(out.VERSION_FULL).toBe("2.3.1-dev");
    });

    it("--release errors out", async () => {
        const { code, stderr } = await runScriptError("--release");
        expect(code).not.toBe(0);
        expect(stderr).toMatch(/requires a development or hotfix branch/);
    });

    it("ignores non-release branches in the development namespace", async () => {
        // development/ZENKO-2986 exists on the real repo, and carries no version
        await git("checkout -b development/ZENKO-2986");
        await commit("closer than development/2.3");
        await git("push origin development/ZENKO-2986");
        await git("checkout improvement/ZENKO-1234");

        const out = await runScript();
        expect(out.VERSION_FULL).toBe("2.3.1-dev");
    });

    it("aborts when the base branch cannot be parsed", async () => {
        // development/1.2.3 looks like a release branch, but is not X.Y: resolving
        // it must abort rather than loop on an unparseable branch name
        await git("push origin development/2.3:refs/heads/development/1.2.3");
        await git("push origin --delete development/2.3");

        const { code, stderr } = await runScriptError();
        expect(code).not.toBe(0);
        expect(stderr).toMatch(/base branch 'development\/1\.2\.3' is not a development or hotfix branch/);
    });
});

describe("version.sh input validation", () => {
    beforeEach(async () => {
        await setupBranch("development/2.3");
    });

    it("rejects multiple modes", async () => {
        const { code, stderr } = await runScriptError("--release", "--preview");
        expect(code).not.toBe(0);
        expect(stderr).toMatch(/multiple modes/);
    });

    it("rejects unknown options", async () => {
        const { code, stderr } = await runScriptError("--bogus");
        expect(code).not.toBe(0);
        expect(stderr).toMatch(/unknown option/);
    });
});

describe("version.sh when sourced", () => {
    beforeEach(async () => {
        await setupBranch("development/2.3");
        await tag("2.3.0");
    });

    it("exports variables into the caller's shell", async () => {
        const { stdout } = await exec(
            `bash -c 'source "${SCRIPT}" --release && echo "$VERSION_FULL|$VERSION|$VERSION_PRERELEASE"'`,
            { cwd: repoPath },
        );
        const [full, version, prerelease] = stdout.trim().split("|");
        expect(full).toBe("2.3.1");
        expect(version).toBe("2.3.1");
        expect(prerelease).toBe("");
    });
});
