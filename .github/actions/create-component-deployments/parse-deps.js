// @ts-check
const fs = require('fs');
const yaml = require('js-yaml');

/**
 * Parse deps.yaml and extract unique {repo, ref} pairs for ghcr.io/scality/* images.
 *
 * @param {string} depsFile - Path to deps.yaml
 * @param {string} selfRepo - The current repo (org/name) to exclude from results
 * @returns {{ components: Array<{repo: string, ref: string}>, repos: string[] }}
 */
function parseDeps(depsFile, selfRepo) {
    const deps = yaml.load(fs.readFileSync(depsFile, 'utf8'));
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

        const key = `${repo} ${entry.tag}`;
        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        components.push({ repo, ref: entry.tag });
    }

    // Unique repo short names (without org/) for token scoping
    const repos = [...new Set(components.map(c => c.repo.split('/')[1]))];

    return { components, repos };
}

module.exports = { parseDeps };
