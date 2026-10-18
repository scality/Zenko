import fs from 'fs';
import os from 'os';
import path from 'path';

const {
    readBuilds,
    renderSummary,
    writeSummary,
} = require('../../.github/scripts/docker-build-summary');

function image(platform: string, layers: [string, number][]) {
    return { platform, layers: layers.map(([digest, size]) => ({ digest, size })) };
}

function build(overrides: object = {}) {
    return {
        build: 'solution/kafka',
        status: 'completed',
        duration: 83.4e9,
        cached: 3,
        total: 4,
        images: [image('linux/amd64', [['base', 2e6], ['kafka', 3e6]])],
        record: 'kafka.dockerbuild',
        url: 'https://github.com/scality/Zenko/actions/runs/1/artifacts/42',
        ...overrides,
    };
}

function tableRows(summary: string) {
    return summary.split('\n').filter(line => line.startsWith('| ') && !line.startsWith('| Build |'));
}

describe('renderSummary', () => {
    it('lists each build', () => {
        const rows = tableRows(renderSummary([build()]));

        expect(rows[0]).toBe('| `solution/kafka` | ✅ completed | 75% | 83s | 5 MB linux/amd64 '
            + '| [kafka.dockerbuild](https://github.com/scality/Zenko/actions/runs/1/artifacts/42) |');
    });

    it('sorts builds by name', () => {
        const rows = tableRows(renderSummary([
            build({ build: 'solution/zookeeper' }),
            build({ build: 'solution/cruise-control' }),
        ]));

        expect(rows[0]).toContain('`solution/cruise-control`');
        expect(rows[1]).toContain('`solution/zookeeper`');
    });

    it('shows the size of each platform', () => {
        const rows = tableRows(renderSummary([build({
            images: [image('linux/amd64', [['amd', 5e6]]), image('linux/arm64', [['arm', 4e6]])],
        })]));

        expect(rows[0]).toContain('| 5 MB linux/amd64<br>4 MB linux/arm64 |');
    });

    it('handles failed builds, without image nor build record', () => {
        const rows = tableRows(renderSummary([
            build({ status: 'failed', cached: 0, total: 0, images: [], url: '' }),
        ]));

        expect(rows[0]).toBe('| `solution/kafka` | ❌ failed | 0% | 83s | - | - |');
    });
});

describe('readBuilds', () => {
    it('reads all build descriptions', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'docker-builds-'));
        fs.writeFileSync(path.join(dir, 'kafka.ndjson'),
            `${JSON.stringify(build({ build: 'a' }))}\n${JSON.stringify(build({ build: 'b' }))}\n`);
        fs.writeFileSync(path.join(dir, 'docs.ndjson'), `${JSON.stringify(build({ build: 'docs' }))}\n`);
        fs.writeFileSync(path.join(dir, 'other.txt'), 'not a build');

        const builds = readBuilds(dir);

        expect(builds.map((b: { build: string }) => b.build).sort()).toEqual(['a', 'b', 'docs']);
    });

    it('handles a missing directory', () => {
        expect(readBuilds(path.join(os.tmpdir(), 'docker-builds-missing'))).toEqual([]);
    });
});

describe('writeSummary', () => {
    function mockCore() {
        const summary = { addRaw: jest.fn(), write: jest.fn() };
        summary.addRaw.mockReturnValue(summary);
        return { info: jest.fn(), summary };
    }

    it('writes the summary', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'docker-builds-'));
        fs.writeFileSync(path.join(dir, 'kafka.ndjson'), `${JSON.stringify(build())}\n`);
        const core = mockCore();

        await writeSummary(core, dir);

        expect(core.summary.addRaw).toHaveBeenCalledWith(expect.stringContaining('### Docker builds'));
        expect(core.summary.write).toHaveBeenCalled();
    });

    it('does not write any summary without builds', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'docker-builds-'));
        const core = mockCore();

        await writeSummary(core, dir);

        expect(core.info).toHaveBeenCalledWith('No docker build found');
        expect(core.summary.write).not.toHaveBeenCalled();
    });
});
