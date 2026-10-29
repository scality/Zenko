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

function formatSizes(sizes) {
    return sizes.map(({ platform, size }) => `${Math.round(size / 1e6)} MB ${platform}`).join('<br>') || '-';
}

function sum(values) {
    return values.reduce((total, value) => total + value, 0);
}

function imageSizes(build) {
    return (build.images || []).map(image => ({
        platform: image.platform,
        size: sum(image.layers.map(layer => layer.size)),
    }));
}

/** Size of all deployed images, for each platform: layers shared between images are counted once */
function totalSizes(builds) {
    const layersByPlatform = new Map();
    for (const build of builds.filter(build => build.deployed)) {
        for (const image of build.images || []) {
            const layers = layersByPlatform.get(image.platform) || new Map();
            image.layers.forEach(layer => layers.set(layer.digest, layer.size));
            layersByPlatform.set(image.platform, layers);
        }
    }
    return [...layersByPlatform]
        .map(([platform, layers]) => ({ platform, size: sum([...layers.values()]) }))
        .sort((a, b) => a.platform.localeCompare(b.platform));
}

function formatBuild(build) {
    const icon = STATUS_ICONS[build.status] || '❔';
    const cached = build.total > 0 ? Math.round(build.cached * 100 / build.total) : 0;
    const record = build.url ? `[${build.record}](${build.url})` : '-';
    return `| \`${build.build}\` | ${icon} ${build.status} | ${cached}% | ${Math.round(build.duration / 1e9)}s `
        + `| ${formatSizes(imageSizes(build))} | ${record} |`;
}

function renderSummary(builds) {
    const rows = [...builds]
        .sort((a, b) => a.build.localeCompare(b.build))
        .map(formatBuild);

    const totals = totalSizes(builds);
    if (totals.length > 0) {
        rows.push(`| **Total** (shared layers counted once) | | | | ${formatSizes(totals)} | |`);
    }

    return [
        '### Docker builds',
        '',
        '| Build | Status | Cached | Duration | Size | Build record |',
        '|:------|:-------|-------:|---------:|-----:|:-------------|',
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
    totalSizes,
    writeSummary,
};
