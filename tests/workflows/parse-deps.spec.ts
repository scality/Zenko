import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

const { parseDeps, stripDigest } = require('../../.github/actions/create-component-deployments/parse-deps');

/** Convert a YAML file to a temporary JSON file (mirrors the yq step in action.yaml). */
function yamlToJson(yamlPath: string): string {
    const jsonPath = fs.mkdtempSync(path.join(require('os').tmpdir(), 'deps-')) + '/deps.json';
    fs.writeFileSync(jsonPath, JSON.stringify(yaml.load(fs.readFileSync(yamlPath, 'utf8'))));
    return jsonPath;
}

const depsFile = yamlToJson(path.join(__dirname, '../../solution/deps.yaml'));

describe('parseDeps', () => {
    it('extracts scality components from deps.yaml', () => {
        const { components } = parseDeps(depsFile, 'scality/zenko');

        expect(components.length).toBeGreaterThan(0);

        // Every component should be a scality repo (but not scality/zenko)
        for (const c of components) {
            expect(c.repo).toMatch(/^scality\//);
            expect(c.repo).not.toBe('scality/zenko');
            expect(c.ref).toBeTruthy();
            expect(c.image).toBeTruthy();
        }
    });

    it('includes known components', () => {
        const { components } = parseDeps(depsFile, 'scality/zenko');
        const repos = components.map((c: { repo: string }) => c.repo);

        expect(repos).toContain('scality/sorbet');
        expect(repos).toContain('scality/backbeat');
        expect(repos).toContain('scality/cloudserver');
    });

    it('filters out self-repo', () => {
        const { components } = parseDeps(depsFile, 'scality/zenko');
        const repos = components.map((c: { repo: string }) => c.repo);

        expect(repos).not.toContain('scality/zenko');
    });

    it('filters out self-repo case-insensitively', () => {
        const { components } = parseDeps(depsFile, 'scality/Zenko');
        const repos = components.map((c: { repo: string }) => c.repo.toLowerCase());

        expect(repos).not.toContain('scality/zenko');
    });

    it('deduplicates by image+ref', () => {
        const { components } = parseDeps(depsFile, 'scality/zenko');
        const keys = components.map((c: { image: string; ref: string }) => `${c.image} ${c.ref}`);
        const unique = new Set(keys);

        expect(keys.length).toBe(unique.size);
    });

    it('excludes non-scality registries', () => {
        const { components } = parseDeps(depsFile, 'scality/zenko');
        const repos = components.map((c: { repo: string }) => c.repo);

        expect(repos).not.toContain('oliver006/redis_exporter');
        expect(repos).not.toContain('seglo/kafka-lag-exporter');
    });

    it('returns empty for a non-existent self-repo matching nothing', () => {
        const { components } = parseDeps(depsFile, 'scality/nonexistent');
        const repos = components.map((c: { repo: string }) => c.repo);

        expect(repos).toContain('scality/zenko');
    });

    it('strips @sha256: digest from tags', () => {
        expect(stripDigest('v1.2.3@sha256:abc123def456')).toBe('v1.2.3');
        expect(stripDigest('9.3.0')).toBe('9.3.0');
    });

    it('sets empty repo for playground images', () => {
        const testDeps = yamlToJson(path.join(__dirname, 'test-deps.yaml'));
        const { components } = parseDeps(testDeps, 'scality/zenko');
        const playground = components.find((c: { image: string }) => c.image.includes('playground'));

        expect(playground).toBeDefined();
        expect(playground.repo).toBe('');
        expect(playground.image).toBe('scality/playground/my-sandbox');
    });

    it('is non-empty and contains known short names', () => {
        const { repos } = parseDeps(depsFile, 'scality/zenko');

        expect(repos.length).toBeGreaterThan(0);
        expect(repos).toContain('sorbet');
        expect(repos).toContain('backbeat');
        expect(repos).toContain('cloudserver');
    });

    describe('repos array', () => {
        it('contains only short names without org prefix', () => {
            const { repos } = parseDeps(depsFile, 'scality/zenko');

            for (const r of repos) {
                expect(r).not.toContain('/');
            }
        });

        it('has no duplicates', () => {
            const { repos } = parseDeps(depsFile, 'scality/zenko');

            expect(repos.length).toBe(new Set(repos).size);
        });

        it('excludes empty strings (playground images are not scoped)', () => {
            const { repos } = parseDeps(depsFile, 'scality/zenko');

            expect(repos).not.toContain('');
        });

        it('is consistent with components — every short name has a matching component', () => {
            const { components, repos } = parseDeps(depsFile, 'scality/zenko');
            const componentShortNames = new Set(
                components.map((c: { repo: string }) => c.repo.split('/')[1]).filter(Boolean),
            );

            for (const r of repos) {
                expect(componentShortNames.has(r)).toBe(true);
            }
        });
    });
});
