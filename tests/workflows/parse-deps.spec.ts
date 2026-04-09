import path from 'path';

const { parseDeps } = require('../../.github/actions/create-component-deployments/parse-deps');

const depsFile = path.join(__dirname, '../../solution/deps.yaml');

describe('parseDeps', () => {
  it('extracts scality components from deps.yaml', () => {
    const { components } = parseDeps(depsFile, 'scality/zenko');

    expect(components.length).toBeGreaterThan(0);

    // Every component should be a scality repo (but not scality/zenko)
    for (const c of components) {
      expect(c.repo).toMatch(/^scality\//);
      expect(c.repo).not.toBe('scality/zenko');
      expect(c.ref).toBeTruthy();
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

  it('deduplicates by repo+ref', () => {
    const { components } = parseDeps(depsFile, 'scality/zenko');
    const keys = components.map((c: { repo: string; ref: string }) => `${c.repo} ${c.ref}`);
    const unique = new Set(keys);

    expect(keys.length).toBe(unique.size);
  });

  it('returns repo short names for token scoping', () => {
    const { repos } = parseDeps(depsFile, 'scality/zenko');

    expect(repos.length).toBeGreaterThan(0);
    for (const r of repos) {
      expect(r).not.toContain('/');
    }
    expect(repos).toContain('sorbet');
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
});
