import { MockGithub } from "@kie/mock-github";
import path from "path";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execCb);

const SCRIPT = path.resolve(__dirname, "../..", ".github/scripts/resolve-base-branch.sh");

let github: MockGithub;
let repoPath: string;
const devChain: string[] = [];

async function git(args: string): Promise<string> {
    const { stdout } = await exec(`git -C "${repoPath}" ${args}`);
    return stdout.trim();
}

async function createDev(name: string) {
    const base = devChain[devChain.length - 1];
    await git(base ? `checkout -b ${name} ${base}` : `checkout -b ${name}`);
    devChain.push(name);
}

async function commitOn(branch: string, message: string) {
    await git(`checkout ${branch}`);
    await git(`commit --allow-empty -m "${message}"`);

    // Waterfall to every newer dev branch in the chain
    const idx = devChain.indexOf(branch);
    if (idx < 0) {
        return;
    }

    let prev = branch;
    for (let i = idx + 1; i < devChain.length; i++) {
        const next = devChain[i];
        await git(`checkout ${next}`);
        await git(`merge --no-ff ${prev}`);
        prev = next;
    }
}

async function branchFrom(name: string, base: string, message: string) {
    await git(`checkout -b ${name} ${base}`);
    await git(`commit --allow-empty -m "${message}"`);
}

async function runScript(): Promise<string> {
    const { stdout } = await exec(SCRIPT, { cwd: repoPath });
    return stdout.trim();
}

beforeAll(async () => {
    github = new MockGithub({
        repo: { zenko: {} },
    });

    await github.setup();
    repoPath = github.repo.getPath("zenko") as string;

    await createDev("development/2.11");
    await commitOn("development/2.11", "2.11: A1");
    await createDev("development/2.12");
    await createDev("development/2.13");

    await commitOn("development/2.11", "2.11: A2");
    await commitOn("development/2.12", "2.12: B1");
    await branchFrom("feat-on-outdated-2.12", "development/2.12", "feat-outdated: K1");
    await commitOn("development/2.13", "2.13: C1");

    await commitOn("development/2.11", "2.11: A3");
    await commitOn("development/2.12", "2.12: B2");
    await commitOn("development/2.13", "2.13: C2");

    await git("push origin development/2.11 development/2.12 development/2.13");

    await branchFrom("feat-on-2.13", "development/2.13", "feat-on-2.13: F1");
    await branchFrom("stacked-on-2.13", "feat-on-2.13", "stacked: H1");
    await branchFrom("feat-on-2.12", "development/2.12", "feat-on-2.12: G1");
    await branchFrom("feat-on-2.11", "development/2.11", "feat-on-2.11: I1");
});

afterAll(async () => {
    await github.teardown();
});

describe("resolve-base-branch.sh", () => {
    it("resolves feature branched off latest dev", async () => {
        await git("checkout feat-on-2.13");
        expect(await runScript()).toBe("development/2.13");
    });

    it("resolves feature branched off middle dev", async () => {
        await git("checkout feat-on-2.12");
        expect(await runScript()).toBe("development/2.12");
    });

    it("resolves feature branched off oldest dev", async () => {
        await git("checkout feat-on-2.11");
        expect(await runScript()).toBe("development/2.11");
    });

    it("resolves stacked branch (feature off feature off dev)", async () => {
        await git("checkout stacked-on-2.13");
        expect(await runScript()).toBe("development/2.13");
    });

    it("resolves a dev branch itself to itself", async () => {
        await git("checkout development/2.12");
        expect(await runScript()).toBe("development/2.12");
    });

    it("resolves feature branched off an outdated dev commit", async () => {
        await git("checkout feat-on-outdated-2.12");
        expect(await runScript()).toBe("development/2.12");
    });
});
