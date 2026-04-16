// @ts-check
const fs = require('fs');

/**
 * Strip @sha256:... digest suffix from a tag.
 * @param {string} tag
 * @returns {string}
 */
function stripDigest(tag) {
    return tag.replace(/@sha256:[0-9a-f]+$/i, '');
}

/**
 * Parse deps.yaml and extract component info for ghcr.io/scality/* images.
 *
 * @param {string} depsFile - Path to deps JSON file (converted from deps.yaml)
 * @param {string} selfRepo - The current repo (org/name) to exclude from results
 * @returns {{ components: Array<{repo: string, ref: string, image: string}>, repos: string[] }}
 */
function parseDeps(depsFile, selfRepo) {
    const deps = JSON.parse(fs.readFileSync(depsFile, 'utf8'));
    const seen = new Set();
    const components = [];
    const normalizedSelfRepo = (selfRepo || '').toLowerCase();

    for (const [, entry] of Object.entries(deps)) {
        const registry = entry.sourceRegistry || '';
        if (!registry.startsWith('ghcr.io/scality') || !entry.image || !entry.tag) {
            continue;
        }

        // ghcr.io/scality/zenko/kafka -> scality/zenko
        const fullPath = registry.replace(/^ghcr\.io\//, '') + '/' + entry.image;
        const repo = fullPath.split('/').slice(0, 2).join('/');

        // GitHub repository names are case-insensitive, normalize to avoid false negatives.
        if (repo.toLowerCase() === normalizedSelfRepo) {
            continue;
        }

        const tag = stripDigest(entry.tag);
        const key = `${fullPath} ${tag}`;
        if (seen.has(key)) {
            continue;
        }

        seen.add(key);

        components.push({
            repo: repo === 'scality/playground' ? '' : repo,
            ref: tag,
            image: fullPath,
        });
    }

    // Unique repo short names (without org/) for token scoping
    const repos = [...new Set(
        components.map(c => c.repo.split('/')[1]).filter(Boolean),
    )];

    return { components, repos };
}

module.exports = { parseDeps, stripDigest };
