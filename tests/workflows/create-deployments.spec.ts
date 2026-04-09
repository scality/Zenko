import sinon from 'sinon';

const { findOrCreateDeployment, createDeployments } = require('../../.github/actions/create-component-deployments/create-deployments');

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
        createDeployment: overrides.createDeployment ?? sinon.stub().resolves({ data: { id: 42 } }),
        listDeployments: overrides.listDeployments ?? sinon.stub().resolves({ data: [] }),
        createDeploymentStatus: overrides.createDeploymentStatus ?? sinon.stub().resolves({}),
      },
    },
  };
}

const deploymentParams = {
  owner: 'scality',
  repo: 'sorbet',
  ref: 'v1.2.2',
  environment: 'zenko/development/2.11',
  description: 'Zenko CI running',
  transient: true,
};

const baseParams = {
  environment: 'zenko/development/2.11',
  transient: true,
  logUrl: 'https://github.com/scality/zenko/actions/runs/123',
  description: 'Zenko CI running',
};

describe('findOrCreateDeployment', () => {
  it('creates directly when createOnly is true', async () => {
    const github = makeMockGithub();

    const id = await findOrCreateDeployment(github, { ...deploymentParams, createOnly: true });

    expect(id).toBe(42);
    expect(github.rest.repos.listDeployments.called).toBe(false);
    expect(github.rest.repos.createDeployment.calledOnce).toBe(true);
    const call = github.rest.repos.createDeployment.firstCall.args[0];
    expect(call).toMatchObject({
      owner: 'scality',
      repo: 'sorbet',
      ref: 'v1.2.2',
      environment: 'zenko/development/2.11',
      transient_environment: true,
      auto_merge: false,
      required_contexts: [],
      production_environment: false,
    });
  });

  it('returns existing deployment when found', async () => {
    const github = makeMockGithub({
      listDeployments: sinon.stub().resolves({ data: [{ id: 99 }] }),
    });

    const id = await findOrCreateDeployment(github, { ...deploymentParams, createOnly: false });

    expect(id).toBe(99);
    expect(github.rest.repos.createDeployment.called).toBe(false);
  });

  it('creates when no existing deployment found', async () => {
    const github = makeMockGithub({
      listDeployments: sinon.stub().resolves({ data: [] }),
      createDeployment: sinon.stub().resolves({ data: { id: 77 } }),
    });

    const id = await findOrCreateDeployment(github, { ...deploymentParams, createOnly: false });

    expect(id).toBe(77);
    expect(github.rest.repos.listDeployments.calledOnce).toBe(true);
    expect(github.rest.repos.createDeployment.calledOnce).toBe(true);
  });

  it('passes transient_environment: false for permanent deployments', async () => {
    const github = makeMockGithub();

    await findOrCreateDeployment(github, { ...deploymentParams, transient: false, createOnly: true });

    const call = github.rest.repos.createDeployment.firstCall.args[0];
    expect(call.transient_environment).toBe(false);
  });
});

describe('createDeployments', () => {
  it('creates deployment and sets in_progress status', async () => {
    const github = makeMockGithub();
    const core = makeMockCore();

    await createDeployments({
      github, core,
      components: [{ repo: 'scality/sorbet', ref: 'v1.2.2' }],
      ...baseParams,
      status: 'in_progress',
    });

    // in_progress skips lookup, creates directly
    expect(github.rest.repos.listDeployments.called).toBe(false);
    expect(github.rest.repos.createDeployment.calledOnce).toBe(true);
    expect(github.rest.repos.createDeploymentStatus.calledOnce).toBe(true);
    const statusCall = github.rest.repos.createDeploymentStatus.firstCall.args[0];
    expect(statusCall.deployment_id).toBe(42);
    expect(statusCall.state).toBe('in_progress');
  });

  it('finds existing deployment on success update', async () => {
    const github = makeMockGithub({
      listDeployments: sinon.stub().resolves({ data: [{ id: 99 }] }),
      createDeploymentStatus: sinon.stub().resolves({}),
      createDeployment: sinon.stub(),
    });
    const core = makeMockCore();

    await createDeployments({
      github, core,
      components: [{ repo: 'scality/sorbet', ref: 'v1.2.2' }],
      ...baseParams,
      status: 'success',
      description: 'Zenko CI passed',
    });

    expect(github.rest.repos.createDeployment.called).toBe(false);
    expect(github.rest.repos.createDeploymentStatus.calledOnce).toBe(true);
    const statusCall = github.rest.repos.createDeploymentStatus.firstCall.args[0];
    expect(statusCall.deployment_id).toBe(99);
    expect(statusCall.state).toBe('success');
  });

  it('creates new deployment if none found on failure update', async () => {
    const github = makeMockGithub({
      listDeployments: sinon.stub().resolves({ data: [] }),
      createDeployment: sinon.stub().resolves({ data: { id: 77 } }),
      createDeploymentStatus: sinon.stub().resolves({}),
    });
    const core = makeMockCore();

    await createDeployments({
      github, core,
      components: [{ repo: 'scality/backbeat', ref: '9.3.0' }],
      ...baseParams,
      status: 'failure',
    });

    expect(github.rest.repos.createDeployment.calledOnce).toBe(true);
    const statusCall = github.rest.repos.createDeploymentStatus.firstCall.args[0];
    expect(statusCall.deployment_id).toBe(77);
    expect(statusCall.state).toBe('failure');
  });

  it('processes multiple components', async () => {
    const github = makeMockGithub();
    const core = makeMockCore();

    await createDeployments({
      github, core,
      components: [
        { repo: 'scality/sorbet', ref: 'v1.2.2' },
        { repo: 'scality/backbeat', ref: '9.3.0' },
        { repo: 'scality/cloudserver', ref: '9.3.4' },
      ],
      ...baseParams,
      status: 'in_progress',
    });

    expect(github.rest.repos.createDeployment.callCount).toBe(3);
    expect(github.rest.repos.createDeploymentStatus.callCount).toBe(3);
  });

  it('continues on individual failure and reports count', async () => {
    const createDeployment = sinon.stub();
    createDeployment.onFirstCall().rejects(new Error('Not found'));
    createDeployment.onSecondCall().resolves({ data: { id: 42 } });

    const github = makeMockGithub({
      createDeployment,
      createDeploymentStatus: sinon.stub().resolves({}),
    });
    const core = makeMockCore();

    const errors = await createDeployments({
      github, core,
      components: [
        { repo: 'scality/sorbet', ref: 'v1.2.2' },
        { repo: 'scality/backbeat', ref: '9.3.0' },
      ],
      ...baseParams,
      status: 'in_progress',
    });

    expect(errors).toBe(1);
    expect(github.rest.repos.createDeploymentStatus.calledOnce).toBe(true);
    expect(core.warning.called).toBe(true);
  });
});
