const fs = require('fs');
const path = require('path');

const STATUS_ICONS = {
    completed: '✅',
    failed: '❌',
    canceled: '🚫',
    running: '⏳',
};

/** Read the build descriptions (ndjson files) uploaded by the upload-docker-builds action */
function readBuilds(dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }
    return fs.readdirSync(dir)
        .filter(file => file.endsWith('.ndjson'))
        .flatMap(file => fs.readFileSync(path.join(dir, file), 'utf8').split('\n'))
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
}

function formatBuild(build) {
    const icon = STATUS_ICONS[build.status] || '❔';
    const cached = build.total > 0 ? Math.round(build.cached * 100 / build.total) : 0;
    const record = build.url ? `[${build.record}](${build.url})` : '-';
    return `| \`${build.build}\` | ${icon} ${build.status} | ${cached}% | ${Math.round(build.duration / 1e9)}s `
        + `| ${record} |`;
}

function renderSummary(builds) {
    const rows = [...builds]
        .sort((a, b) => a.build.localeCompare(b.build))
        .map(formatBuild);

    return [
        '### Docker builds',
        '',
        '| Build | Status | Cached | Duration | Build record |',
        '|:------|:-------|-------:|---------:|:-------------|',
        ...rows,
        '',
        "Build records can be imported in Docker Desktop's Builds view.",
        '',
    ].join('\n');
}

async function writeSummary(core, dir) {
    const builds = readBuilds(dir);
    if (builds.length === 0) {
        core.info('No docker build found');
        return;
    }
    await core.summary.addRaw(renderSummary(builds)).write();
}

module.exports = {
    readBuilds,
    renderSummary,
    writeSummary,
};
