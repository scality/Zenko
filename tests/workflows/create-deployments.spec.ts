import sinon from 'sinon';

const { findOrCreateDeployment, resolveRef, resolveDeployment, createDeployments, resolveFromManifest } = require('../../.github/actions/create-component-deployments/create-deployments');

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
                getCommit: overrides.getCommit ?? sinon.stub().resolves({ data: { sha: 'abc1234def' } }),
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
    production: false,
};

const baseParams = {
    environment: 'zenko/development/2.11',
    transient: true,
    production: false,
    logUrl: 'https://github.com/scality/zenko/actions/runs/123',
    description: 'Zenko CI running',
    token: 'fake-token',
};

describe('resolveDeployment', () => {
    const deployParams = {
      token: 'fake-token',
      environment: 'zenko/dev',
      description: 'test',
      transient: true,
      production: false,
      createOnly: true,
    };
    const component = { repo: 'scality/sorbet', ref: 'v1.0.0', image: 'scality/sorbet' };

    it('creates deployment and returns resolved component', async () => {
        const github = makeMockGithub();
        const core = makeMockCore();
        const resolve = sinon.stub();

        const result = await resolveDeployment(github, core, resolve, component, deployParams);

        expect(result).toEqual({ component, deploymentId: 42 });
        expect(resolve.called).toBe(false);
    });

    it('resolves from manifest when repo is empty', async () => {
        const github = makeMockGithub();
        const core = makeMockCore();
        const resolve = sinon.stub().resolves({ repo: 'scality/sorbet', ref: 'deadbeef' });

        const result = await resolveDeployment(github, core, resolve,
            { repo: '', ref: 'some-tag', image: 'scality/playground/sandbox' },
            deployParams,
        );

        expect(result.component).toEqual({ repo: 'scality/sorbet', ref: 'deadbeef', image: 'scality/playground/sandbox' });
        expect(result.deploymentId).toBe(42);
        expect(resolve.calledOnce).toBe(true);
        const call = github.rest.repos.createDeployment.firstCall.args[0];
        expect(call.owner).toBe('scality');
        expect(call.repo).toBe('sorbet');
        expect(call.ref).toBe('deadbeef');
    });

    it('throws when manifest resolution fails to return a repo', async () => {
        const github = makeMockGithub();
        const core = makeMockCore();
        const resolve = sinon.stub().resolves(null);

        await expect(
           resolveDeployment(github, core, resolve, { repo: '', ref: 'tag', image: 'scality/playground/x' }, deployParams)
        ).rejects.toThrow('Could not resolve repo');
    });

    it('resolves ref from manifest when the tag is not a git ref', async () => {
        const err = Object.assign(new Error('No commit found'), { status: 422 });
        const github = makeMockGithub({ getCommit: sinon.stub().rejects(err) });
        const core = makeMockCore();
        const resolve = sinon.stub().resolves({ repo: 'scality/sorbet', ref: 'abc1234' });

        const result = await resolveDeployment(github, core, resolve, component, deployParams);

        expect(result.component).toEqual({ repo: 'scality/sorbet', ref: 'abc1234', image: 'scality/sorbet' });
        expect(github.rest.repos.createDeployment.calledOnce).toBe(true);
        expect(github.rest.repos.createDeployment.firstCall.args[0].ref).toBe('abc1234');
    });

    it('throws deployment errors directly', async () => {
        const err = Object.assign(new Error('Server error'), { status: 500 });
        const github = makeMockGithub({ createDeployment: sinon.stub().rejects(err) });
        const core = makeMockCore();
        const resolve = sinon.stub();

        await expect(
           resolveDeployment(github, core, resolve, component, deployParams)
        ).rejects.toMatchObject({ status: 500 });
        expect(resolve.called).toBe(false);
    });
  });

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

      it('passes production_environment: true for production deployments', async () => {
          const github = makeMockGithub();

          await findOrCreateDeployment(github, {
              ...deploymentParams, transient: false, production: true, createOnly: true,
          });

          const call = github.rest.repos.createDeployment.firstCall.args[0];
          expect(call.production_environment).toBe(true);
          expect(call.transient_environment).toBe(false);
      });
});

describe('resolveRef', () => {
    const notFound = () => Object.assign(new Error('No commit found'), { status: 422 });

    it('returns the tag when it is a git ref of the repo', async () => {
        const github = makeMockGithub();
        const resolve = sinon.stub();

        const ref = await resolveRef(github, 'scality/backbeat', '9.3.0', 'scality/backbeat', 'tok', resolve);

        expect(ref).toBe('9.3.0');
        expect(github.rest.repos.getCommit.firstCall.args[0]).toEqual({ owner: 'scality', repo: 'backbeat', ref: '9.3.0' });
        expect(resolve.called).toBe(false);
    });

    it('returns the image revision when the tag is not a git ref', async () => {
        const github = makeMockGithub({ getCommit: sinon.stub().rejects(notFound()) });
        const resolve = sinon.stub().resolves({ repo: 'scality/backbeat', ref: 'abc1234' });

        const ref = await resolveRef(github, 'scality/backbeat', 'dev-tag', 'scality/backbeat', 'tok', resolve);

        expect(ref).toBe('abc1234');
        expect(resolve.firstCall.args).toEqual(['scality/backbeat', 'dev-tag', 'tok']);
    });

    it('throws when the image was built from another repo', async () => {
        const github = makeMockGithub({ getCommit: sinon.stub().rejects(notFound()) });
        const resolve = sinon.stub().resolves({ repo: 'scality/cloudserver', ref: 'abc1234' });

        await expect(
            resolveRef(github, 'scality/backbeat', 'dev-tag', 'scality/backbeat', 'tok', resolve),
        ).rejects.toThrow('Image scality/backbeat:dev-tag was built from scality/cloudserver, not scality/backbeat');
    });

    it('throws when the image has no revision', async () => {
        const github = makeMockGithub({ getCommit: sinon.stub().rejects(notFound()) });

        await expect(
            resolveRef(github, 'scality/backbeat', 'dev-tag', 'scality/backbeat', 'tok', sinon.stub().resolves(null)),
        ).rejects.toThrow('Could not resolve ref for scality/backbeat:dev-tag on scality/backbeat');
    });

    it('throws unexpected commit lookup errors', async () => {
        const err = Object.assign(new Error('Forbidden'), { status: 403 });
        const github = makeMockGithub({ getCommit: sinon.stub().rejects(err) });
        const resolve = sinon.stub();

        await expect(
            resolveRef(github, 'scality/backbeat', '9.3.0', 'scality/backbeat', 'tok', resolve),
        ).rejects.toMatchObject({ status: 403 });
        expect(resolve.called).toBe(false);
    });
});

describe('createDeployments', () => {
    it('calls resolveDeployment and sets deployment status', async () => {
        const github = makeMockGithub();
        const core = makeMockCore();

        await createDeployments({
            github, core,
            components: [{ repo: 'scality/sorbet', ref: 'v1.2.2', image: 'scality/sorbet' }],
            ...baseParams,
            status: 'in_progress',
        });

        expect(github.rest.repos.createDeployment.calledOnce).toBe(true);
        expect(github.rest.repos.createDeploymentStatus.calledOnce).toBe(true);
        const statusCall = github.rest.repos.createDeploymentStatus.firstCall.args[0];
        expect(statusCall.deployment_id).toBe(42);
        expect(statusCall.state).toBe('in_progress');
        expect(statusCall.log_url).toBe(baseParams.logUrl);
        expect(statusCall.description).toBe(baseParams.description);
    });

    it('processes multiple components', async () => {
        const github = makeMockGithub();
        const core = makeMockCore();

        await createDeployments({
            github, core,
            components: [
                { repo: 'scality/sorbet', ref: 'v1.2.2', image: 'scality/sorbet' },
                { repo: 'scality/backbeat', ref: '9.3.0', image: 'scality/backbeat' },
                { repo: 'scality/cloudserver', ref: '9.3.4', image: 'scality/cloudserver' },
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
            { repo: 'scality/sorbet', ref: 'v1.2.2', image: 'scality/sorbet' },
            { repo: 'scality/backbeat', ref: '9.3.0', image: 'scality/backbeat' },
          ],
          ...baseParams,
          status: 'in_progress',
        });

        expect(errors).toBe(1);
        expect(github.rest.repos.createDeploymentStatus.calledOnce).toBe(true);
        expect(core.warning.called).toBe(true);
    });
});

describe('resolveFromManifest', () => {
    let fetchStub: sinon.SinonStub;

    function mockOk(body: object) {
        return { ok: true, json: () => Promise.resolve(body) };
    }
    function mockFail() {
        return { ok: false };
    }

    beforeEach(() => {
       fetchStub = sinon.stub(globalThis as any, 'fetch');
    });

    afterEach(() => {
        fetchStub.restore();
    });

    it('returns null when auth request fails', async () => {
        fetchStub.resolves(mockFail());

        const result = await resolveFromManifest('scality/sorbet', 'v1.0.0', 'gh-token');

        expect(result).toBeNull();
        expect(fetchStub.callCount).toBe(1);
    });

    it('returns null when manifest request fails', async () => {
        fetchStub.onFirstCall().resolves(mockOk({ token: 'reg-token' }));
        fetchStub.onSecondCall().resolves(mockFail());

        const result = await resolveFromManifest('scality/sorbet', 'v1.0.0', 'gh-token');

        expect(result).toBeNull();
        expect(fetchStub.callCount).toBe(2);
    });

    it('resolves from OCI manifest annotations', async () => {
        fetchStub.onFirstCall().resolves(mockOk({ token: 'reg-token' }));
        fetchStub.onSecondCall().resolves(mockOk({
            annotations: {
                'org.opencontainers.image.revision': 'abc1234',
                'org.opencontainers.image.source': 'https://github.com/scality/sorbet',
            },
        }));

        const result = await resolveFromManifest('scality/sorbet', 'v1.0.0', 'gh-token');

        expect(result).toEqual({ repo: 'scality/sorbet', ref: 'abc1234' });
        expect(fetchStub.callCount).toBe(2); // no blob fetch needed
    });

    it('falls back to config blob when manifest has no annotations', async () => {
        fetchStub.onFirstCall().resolves(mockOk({ token: 'reg-token' }));
        fetchStub.onSecondCall().resolves(mockOk({
            config: { digest: 'sha256:deadbeef' },
        }));
        fetchStub.onThirdCall().resolves(mockOk({
            config: {
                Labels: {
                    'org.opencontainers.image.revision': 'deadbeef',
                    'org.opencontainers.image.source': 'https://github.com/scality/cloudserver',
                },
            },
        }));

        const result = await resolveFromManifest('scality/cloudserver', 'latest', 'gh-token');

        expect(result).toEqual({ repo: 'scality/cloudserver', ref: 'deadbeef' });
        expect(fetchStub.callCount).toBe(3);
    });

    it('returns null when no revision found in manifest or blob', async () => {
        fetchStub.onFirstCall().resolves(mockOk({ token: 'reg-token' }));
        fetchStub.onSecondCall().resolves(mockOk({
            config: { digest: 'sha256:deadbeef' },
        }));
        fetchStub.onThirdCall().resolves(mockOk({
            config: { Labels: {} },
        }));

        const result = await resolveFromManifest('scality/sorbet', 'v1.0.0', 'gh-token');

        expect(result).toBeNull();
    });

    it('strips .git suffix from source annotation', async () => {
        fetchStub.onFirstCall().resolves(mockOk({ token: 'reg-token' }));
        fetchStub.onSecondCall().resolves(mockOk({
            annotations: {
                'org.opencontainers.image.revision': 'abc1234',
                'org.opencontainers.image.source': 'https://github.com/scality/backbeat.git',
            },
        }));

        const result = await resolveFromManifest('scality/backbeat', 'v9.0.0', 'gh-token');

        expect(result).toEqual({ repo: 'scality/backbeat', ref: 'abc1234' });
    });

    it('returns empty repo when source annotation is missing', async () => {
        fetchStub.onFirstCall().resolves(mockOk({ token: 'reg-token' }));
        fetchStub.onSecondCall().resolves(mockOk({
            annotations: {
                'org.opencontainers.image.revision': 'abc1234',
            },
        }));

        const result = await resolveFromManifest('scality/sorbet', 'v1.0.0', 'gh-token');

        expect(result).toEqual({ repo: '', ref: 'abc1234' });
    });

    it('uses Basic auth with x-access-token for the token request', async () => {
        fetchStub.onFirstCall().resolves(mockOk({ token: 'reg-token' }));
        fetchStub.onSecondCall().resolves(mockOk({
           annotations: { 'org.opencontainers.image.revision': 'abc1234' },
        }));

        await resolveFromManifest('scality/sorbet', 'v1.0.0', 'my-secret-token');

        const authCall = fetchStub.firstCall;
        const expectedAuth = `Basic ${Buffer.from('x-access-token:my-secret-token').toString('base64')}`;
        expect(authCall.args[0]).toContain('/token?scope=repository:scality/sorbet:pull');
        expect(authCall.args[1].headers.Authorization).toBe(expectedAuth);
    });

    it('uses registry token as Bearer for manifest and blob fetches', async () => {
        fetchStub.onFirstCall().resolves(mockOk({ token: 'scoped-reg-token' }));
        fetchStub.onSecondCall().resolves(mockOk({
          annotations: { 'org.opencontainers.image.revision': 'abc1234' },
        }));

        await resolveFromManifest('scality/sorbet', 'v1.0.0', 'gh-token');

        const manifestCall = fetchStub.secondCall;
        expect(manifestCall.args[1].headers.Authorization).toBe('Bearer scoped-reg-token');
    });

    it('follows an image index to the image manifest, skipping attestations', async () => {
        fetchStub.onFirstCall().resolves(mockOk({ token: 'reg-token' }));
        fetchStub.onSecondCall().resolves(mockOk({
            manifests: [
                {
                    digest: 'sha256:attestation',
                    annotations: { 'vnd.docker.reference.type': 'attestation-manifest' },
                },
                { digest: 'sha256:image' },
            ],
        }));
        fetchStub.onThirdCall().resolves(mockOk({
            annotations: {
                'org.opencontainers.image.revision': 'abc1234',
                'org.opencontainers.image.source': 'https://github.com/scality/backbeat',
            },
        }));

        const result = await resolveFromManifest('scality/backbeat', '9.6.3-dev.2.sha-abc1234', 'gh-token');

        expect(result).toEqual({ repo: 'scality/backbeat', ref: 'abc1234' });
        expect(fetchStub.secondCall.args[1].headers.Accept).toContain('application/vnd.oci.image.index.v1+json');
        expect(fetchStub.thirdCall.args[0]).toContain('/manifests/sha256:image');
    });

    it('resolves from image index annotations', async () => {
        fetchStub.onFirstCall().resolves(mockOk({ token: 'reg-token' }));
        fetchStub.onSecondCall().resolves(mockOk({
            manifests: [{ digest: 'sha256:image' }],
            annotations: { 'org.opencontainers.image.revision': 'abc1234' },
        }));

        const result = await resolveFromManifest('scality/backbeat', 'v1.0.0', 'gh-token');

        expect(result).toEqual({ repo: '', ref: 'abc1234' });
        expect(fetchStub.callCount).toBe(2);
    });

    it('tries each image of an index until one has a revision', async () => {
        fetchStub.onCall(0).resolves(mockOk({ token: 'reg-token' }));
        fetchStub.onCall(1).resolves(mockOk({
            manifests: [{ digest: 'sha256:image1' }, { digest: 'sha256:image2' }],
        }));
        fetchStub.onCall(2).resolves(mockOk({ config: { digest: 'sha256:config1' } }));
        fetchStub.onCall(3).resolves(mockOk({ config: { Labels: {} } }));
        fetchStub.onCall(4).resolves(mockOk({
            annotations: { 'org.opencontainers.image.revision': 'abc1234' },
        }));

        const result = await resolveFromManifest('scality/backbeat', 'v1.0.0', 'gh-token');

        expect(result).toEqual({ repo: '', ref: 'abc1234' });
        expect(fetchStub.getCall(4).args[0]).toContain('/manifests/sha256:image2');
    });

    it('follows nested image indexes', async () => {
        fetchStub.onCall(0).resolves(mockOk({ token: 'reg-token' }));
        fetchStub.onCall(1).resolves(mockOk({ manifests: [{ digest: 'sha256:index' }] }));
        fetchStub.onCall(2).resolves(mockOk({ manifests: [{ digest: 'sha256:image' }] }));
        fetchStub.onCall(3).resolves(mockOk({
            annotations: { 'org.opencontainers.image.revision': 'abc1234' },
        }));

        const result = await resolveFromManifest('scality/backbeat', 'v1.0.0', 'gh-token');

        expect(result).toEqual({ repo: '', ref: 'abc1234' });
    });

    it('returns null when an image index has only attestations', async () => {
        fetchStub.onFirstCall().resolves(mockOk({ token: 'reg-token' }));
        fetchStub.onSecondCall().resolves(mockOk({
            manifests: [{
                digest: 'sha256:attestation',
                annotations: { 'vnd.docker.reference.type': 'attestation-manifest' },
            }],
        }));

        const result = await resolveFromManifest('scality/backbeat', 'v1.0.0', 'gh-token');

        expect(result).toBeNull();
        expect(fetchStub.callCount).toBe(2);
    });
});
