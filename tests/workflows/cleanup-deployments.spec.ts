import sinon from 'sinon';

const { cleanupDeployments } = require('../../.github/actions/create-component-deployments/cleanup-deployments');

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
                getCommit: overrides.getCommit ?? sinon.stub().resolves({ data: { sha: 'abc1234def' } }),
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

    it('lists deployments at the commit of a dev tag', async () => {
        const github = makeMockGithub({
            getCommit: sinon.stub().resolves({ data: { sha: '13bbb8b13ea055fdc35df2df9c230b14f278988e' } }),
        });
        const core = makeMockCore();

        await cleanupDeployments({
            github, core,
            components: [{ repo: 'scality/backbeat', ref: '9.6.3-dev.2.sha-13bbb8b', image: 'scality/backbeat' }],
            ...baseParams,
        });

        expect(github.rest.repos.getCommit.firstCall.args[0].ref).toBe('13bbb8b');
        expect(github.rest.repos.listDeployments.firstCall.args[0]).toMatchObject({
            owner: 'scality', repo: 'backbeat', ref: '13bbb8b13ea055fdc35df2df9c230b14f278988e',
        });
    });
});
