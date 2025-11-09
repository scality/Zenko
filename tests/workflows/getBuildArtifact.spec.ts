// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getBuildArtifact } = require('../../.github/scripts/get-build-artifact');
import * as sinon from 'sinon';

describe('getBuildArtifact', () => {
    let mockGithub: any;
    let mockContext: any;
    let mockCore: any;
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        
        // Create mock GitHub API client
        mockGithub = {
            rest: {
                actions: {
                    listWorkflowRuns: sandbox.stub()
                }
            }
        };

        mockContext = {
            repo: {
                owner: 'scality',
                repo: 'zenko',
            },
            sha: 'abcd1234567890abcdef1234567890abcdefabcd',
        };

        mockCore = {
            info: sandbox.stub(),
            exportVariable: sandbox.stub(),
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should construct correct artifacts name from successful run', async () => {
        mockGithub.rest.actions.listWorkflowRuns.resolves({
            data: {
                total_count: 1,
                workflow_runs: [
                    {
                        id: 12345,
                        name: 'build-iso-and-end2end-test',
                        conclusion: 'success',
                        run_number: 678,
                        status: 'completed',
                        head_sha: 'abcd1234567890abcdef1234567890abcdefabcd',
                        workflow_id: 1,
                        url: 'https://api.github.com/repos/scality/zenko/actions/runs/12345',
                        html_url: 'https://github.com/scality/zenko/actions/runs/12345',
                        created_at: '2023-01-01T00:00:00Z',
                        updated_at: '2023-01-01T00:00:00Z',
                        run_started_at: '2023-01-01T00:00:00Z',
                    },
                ],
            },
        });

        const result = await getBuildArtifact(mockGithub, mockContext, mockCore);
        expect(result).toBe('github:scality:zenko:staging-abcd123456.build-iso-and-end2end-test.678');

        // Verify the API call was made with correct parameters
        expect(mockGithub.rest.actions.listWorkflowRuns.calledOnce).toBe(true);
        expect(mockGithub.rest.actions.listWorkflowRuns.calledWith({
            owner: 'scality',
            repo: 'zenko',
            workflow_id: 'end2end.yaml',
            head_sha: 'abcd1234567890abcdef1234567890abcdefabcd',
            status: 'completed',
            conclusion: 'success'
        })).toBe(true);

        // Verify logging calls
        expect(mockCore.info.calledWith('Looking for successful builds for commit: abcd1234567890abcdef1234567890abcdefabcd')).toBe(true);
        expect(mockCore.info.calledWith('Found staging run: 12345 with conclusion: success')).toBe(true);
        expect(mockCore.info.calledWith('Auto-derived artifacts name: github:scality:zenko:staging-abcd123456.build-iso-and-end2end-test.678')).toBe(true);
    });

    it('should fail when no staging workflow run is found', async () => {
        mockGithub.rest.actions.listWorkflowRuns.resolves({
            data: {
                total_count: 0,
                workflow_runs: [],
            },
        });

        await expect(getBuildArtifact(mockGithub, mockContext, mockCore))
            .rejects
            .toThrow('No successful end2end workflow run found for commit abcd1234567890abcdef1234567890abcdefabcd');

        // Verify the API call was made with correct parameters
        expect(mockGithub.rest.actions.listWorkflowRuns.calledOnce).toBe(true);
        expect(mockGithub.rest.actions.listWorkflowRuns.calledWith({
            owner: 'scality',
            repo: 'zenko',
            workflow_id: 'end2end.yaml',
            head_sha: 'abcd1234567890abcdef1234567890abcdefabcd',
            status: 'completed',
            conclusion: 'success'
        })).toBe(true);
    });

    it('should handle workflow run with multiple workflows', async () => {
        mockGithub.rest.actions.listWorkflowRuns.resolves({
            data: {
                total_count: 2,
                workflow_runs: [
                    {
                        id: 56789,
                        name: 'build-iso-and-end2end-test',
                        conclusion: 'success',
                        run_number: 999,
                        status: 'completed',
                        head_sha: 'abcd1234567890abcdef1234567890abcdefabcd',
                        url: 'https://api.github.com/repos/scality/zenko/actions/runs/56789',
                        html_url: 'https://github.com/scality/zenko/actions/runs/56789',
                        created_at: '2024-01-01T00:00:00Z',
                        updated_at: '2024-01-01T00:00:00Z',
                        run_started_at: '2024-01-01T00:00:00Z',
                    },
                    {
                        id: 12345,
                        name: 'build-iso-and-end2end-test',
                        conclusion: 'success',
                        run_number: 678,
                        status: 'completed',
                        head_sha: 'abcd1234567890abcdef1234567890abcdefabcd',
                        workflow_id: 1,
                        url: 'https://api.github.com/repos/scality/zenko/actions/runs/12345',
                        html_url: 'https://github.com/scality/zenko/actions/runs/12345',
                        created_at: '2023-01-01T00:00:00Z',
                        updated_at: '2023-01-01T00:00:00Z',
                        run_started_at: '2023-01-01T00:00:00Z',
                    },
                ],
            },
        });

        const result = await getBuildArtifact(mockGithub, mockContext, mockCore);

        expect(result).toBe('github:scality:zenko:staging-abcd123456.build-iso-and-end2end-test.999');
        expect(mockCore.info.calledWith('Found staging run: 56789 with conclusion: success')).toBe(true);
    });
});