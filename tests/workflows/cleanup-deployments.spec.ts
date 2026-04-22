import sinon from 'sinon';

const { cleanupDeployments, resolveRepo } = require('../../.github/actions/create-component-deployments/cleanup-deployments');

function makeMockCore() {
    return {
        info: sinon.stub(),
        warning: sinon.stub(),
        startGroup: sinon.stub(),
        endGroup: sinon.stub(),
    };
}

function makeMockGithub(overrides: Record<string, sinon.SinonStub> = {}) {
    return {
        rest: {
            repos: {
                listDeployments: overrides.listDeployments ?? sinon.stub().resolves({ data: [] }),
                createDeploymentStatus: overrides.createDeploymentStatus ?? sinon.stub().resolves({}),
            },
        },
    };
}

const baseParams = {
    environmentPrefix: 'zenko/improvement/ZKOP-534@',
    token: 'fake-token',
};

describe('cleanupDeployments', () => {
    it('inactivates deployments whose environment matches the prefix', async () => {
        const github = makeMockGithub({
            listDeployments: sinon.stub().resolves({
                data: [
                    { id: 1, environment: 'zenko/improvement/ZKOP-534@2.14' },
                ],
            }),
        });
        const core = makeMockCore();

        await cleanupDeployments({
            github, core,
            components: [{ repo: 'scality/sorbet', ref: 'v1.2.2', image: 'scality/sorbet' }],
            ...baseParams,
        });

        expect(github.rest.repos.listDeployments.calledOnce).toBe(true);
        const listCall = github.rest.repos.listDeployments.firstCall.args[0];
        expect(listCall).toMatchObject({
            owner: 'scality', repo: 'sorbet', ref: 'v1.2.2',
        });

        expect(github.rest.repos.createDeploymentStatus.calledOnce).toBe(true);
        const statusCall = github.rest.repos.createDeploymentStatus.firstCall.args[0];
        expect(statusCall).toMatchObject({
            owner: 'scality', repo: 'sorbet', deployment_id: 1, state: 'inactive',
        });
    });

    it('skips deployments whose environment does not match the prefix', async () => {
        const github = makeMockGithub({
            listDeployments: sinon.stub().resolves({
                data: [
                    { id: 1, environment: 'zenko/development/2.14' },
                    { id: 2, environment: 'zenko/improvement/OTHER-BRANCH@2.14' },
                ],
            }),
        });
        const core = makeMockCore();

        await cleanupDeployments({
            github, core,
            components: [{ repo: 'scality/sorbet', ref: 'v1.2.2', image: 'scality/sorbet' }],
            ...baseParams,
        });

        expect(github.rest.repos.createDeploymentStatus.called).toBe(false);
    });

    it('matches sibling-base envs (zenko/<branch>@2.13 and @2.14) under same prefix', async () => {
        const github = makeMockGithub({
            listDeployments: sinon.stub().resolves({
                data: [
                    { id: 1, environment: 'zenko/improvement/ZKOP-534@2.13' },
                    { id: 2, environment: 'zenko/improvement/ZKOP-534@2.14' },
                ],
            }),
        });
        const core = makeMockCore();

        await cleanupDeployments({
            github, core,
            components: [{ repo: 'scality/sorbet', ref: 'v1.2.2', image: 'scality/sorbet' }],
            ...baseParams,
        });

        expect(github.rest.repos.createDeploymentStatus.callCount).toBe(2);
    });

    it('does not match a longer branch name with the same prefix (no @ terminator)', async () => {
        const github = makeMockGithub({
            listDeployments: sinon.stub().resolves({
                data: [
                    // Different branch that happens to start with the same chars.
                    { id: 1, environment: 'zenko/improvement/ZKOP-534-extended@2.14' },
                ],
            }),
        });
        const core = makeMockCore();

        await cleanupDeployments({
            github, core,
            components: [{ repo: 'scality/sorbet', ref: 'v1.2.2', image: 'scality/sorbet' }],
            ...baseParams,
        });

        expect(github.rest.repos.createDeploymentStatus.called).toBe(false);
    });

    it('processes multiple components independently', async () => {
        const github = makeMockGithub({
            listDeployments: sinon.stub()
                .onFirstCall().resolves({ data: [{ id: 11, environment: 'zenko/improvement/ZKOP-534@2.14' }] })
                .onSecondCall().resolves({ data: [{ id: 22, environment: 'zenko/improvement/ZKOP-534@2.14' }] }),
        });
        const core = makeMockCore();

        await cleanupDeployments({
            github, core,
            components: [
                { repo: 'scality/sorbet', ref: 'v1.2.2', image: 'scality/sorbet' },
                { repo: 'scality/backbeat', ref: '9.3.0', image: 'scality/backbeat' },
            ],
            ...baseParams,
        });

        expect(github.rest.repos.listDeployments.callCount).toBe(2);
        expect(github.rest.repos.createDeploymentStatus.callCount).toBe(2);
        expect(github.rest.repos.createDeploymentStatus.firstCall.args[0].deployment_id).toBe(11);
        expect(github.rest.repos.createDeploymentStatus.secondCall.args[0].deployment_id).toBe(22);
    });

    it('continues on per-component failure', async () => {
        const github = makeMockGithub({
            listDeployments: sinon.stub()
                .onFirstCall().rejects(new Error('boom'))
                .onSecondCall().resolves({ data: [{ id: 22, environment: 'zenko/improvement/ZKOP-534@2.14' }] }),
        });
        const core = makeMockCore();

        await cleanupDeployments({
            github, core,
            components: [
                { repo: 'scality/sorbet', ref: 'v1.2.2', image: 'scality/sorbet' },
                { repo: 'scality/backbeat', ref: '9.3.0', image: 'scality/backbeat' },
            ],
            ...baseParams,
        });

        expect(core.warning.calledOnce).toBe(true);
        expect(github.rest.repos.createDeploymentStatus.calledOnce).toBe(true);
        expect(github.rest.repos.createDeploymentStatus.firstCall.args[0].deployment_id).toBe(22);
    });

    it('does nothing when no deployments match the ref', async () => {
        const github = makeMockGithub({
            listDeployments: sinon.stub().resolves({ data: [] }),
        });
        const core = makeMockCore();

        await cleanupDeployments({
            github, core,
            components: [{ repo: 'scality/sorbet', ref: 'v1.2.2', image: 'scality/sorbet' }],
            ...baseParams,
        });

        expect(github.rest.repos.createDeploymentStatus.called).toBe(false);
        expect(core.info.called).toBe(true);
    });
});

describe('resolveRepo', () => {
    let fetchStub: sinon.SinonStub;

    function mockOk(body: object) {
        return { ok: true, json: () => Promise.resolve(body) };
    }

    beforeEach(() => {
        fetchStub = sinon.stub(globalThis as any, 'fetch');
    });

    afterEach(() => {
        fetchStub.restore();
    });

    it('returns the component unchanged when repo is set', async () => {
        const component = { repo: 'scality/sorbet', ref: 'v1.0.0', image: 'scality/sorbet' };

        const result = await resolveRepo(component, 'tok');

        expect(result).toBe(component);
        expect(fetchStub.called).toBe(false);
    });

    it('resolves repo and ref via OCI manifest when repo is empty', async () => {
        fetchStub.onFirstCall().resolves(mockOk({ token: 'reg-token' }));
        fetchStub.onSecondCall().resolves(mockOk({
            annotations: {
                'org.opencontainers.image.revision': 'abc1234',
                'org.opencontainers.image.source': 'https://github.com/scality/sandbox',
            },
        }));

        const result = await resolveRepo(
            { repo: '', ref: 'sha256-tag', image: 'scality/playground/sandbox' },
            'tok',
        );

        expect(result).toEqual({
            repo: 'scality/sandbox', ref: 'abc1234', image: 'scality/playground/sandbox',
        });
    });

    it('throws when manifest resolution returns no repo', async () => {
        fetchStub.onFirstCall().resolves({ ok: false });

        await expect(
            resolveRepo({ repo: '', ref: 'tag', image: 'scality/playground/x' }, 'tok'),
        ).rejects.toThrow('Could not resolve repo');
    });
});
