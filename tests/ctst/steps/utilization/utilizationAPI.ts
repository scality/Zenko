import { When, Then, ITestCaseHookParameter } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import Zenko from '../../world/Zenko';
import { Command } from 'cli-testing';
import { Identity } from 'cli-testing';
import ScubaClient, { ScubaMetrics } from 'scubaclient';
import { prepareMetricsScenarios } from '../../common/utils';

export async function prepareUtilizationScenarios(world: Zenko, scenarioConfiguration: ITestCaseHookParameter) {
    await prepareMetricsScenarios(world, scenarioConfiguration, {
        versioning: '',
        jobNamespace: 'utilization-setup'
    });
}

When('the user retrieves utilization metrics using scubaclient for metric type {string}',
    async function (this: Zenko, metricType: string) {
        // Get the current identity settings from Zenko world
        const accountName = this.getSaved<string>('accountName');
        
        // Get credentials for the current identity (already set up by the "Given a TYPE type" step)
        const userCredentials = Identity.getCurrentCredentials();

        if (!userCredentials) {
            throw new Error('User credentials not found');
        }

        this.addToSaved('metricType', metricType);

        const client = new ScubaClient({
            port: parseInt(this.parameters.UtilizationServicePort),
            host: this.parameters.UtilizationServiceHost,
            useHttps: false,
            auth: {
                awsV4: {
                    credentials: {
                        accessKeyId: userCredentials.accessKeyId,
                        secretAccessKey: userCredentials.secretAccessKey,
                        sessionToken: userCredentials.sessionToken,
                    },
                    region: 'us-east-1',
                    service: 's3',
                },
            },
        });

        let metricName;

        switch (metricType) {
        case 'bucket':
            metricName = this.getSaved<string>('bucketName');
            break;
        case 'account':
            metricName = accountName;
            break;
        case 'location':
            metricName = this.getSaved<string>('locationName') || 'us-east-1';
            break;
        default:
            throw new Error(`Unsupported metric type: ${metricType}`);
        }

        try {
            // @ts-expect-error SUR client does not yet has the "location" type listed
            const response = await client.getLatestMetrics(metricType, metricName);
            const command: Command = {
                err: '',
                stdout: JSON.stringify(response),
                stderr: '',
            };
            this.setResult(command);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            this.logger.debug('Error retrieving utilization metrics', {
                err: err.message,
            });
            this.setResult({
                err: err.message,
                stdout: '',
                stderr: err.message,
            });
        }
    });

Then('the latest utilization metrics are retrieved',
    function (this: Zenko) {
        const result = this.getResult();
        assert.strictEqual(result.err, '', `Expected no error but got: ${result.err}`);

        this.logger.debug('Utilization metrics', {
            stdout: result.stdout,
            stderr: result.stderr,
            err: result.err,
        });

        const response = JSON.parse(result.stdout) as ScubaMetrics;
        assert.ok(response.objectsTotal > 0, 'Bucket metrics should contain objectCount');
        assert.ok(response.bytesTotal > 0, 'Bucket metrics should contain bytesTotal');
        assert.ok(response.metricsClass === this.getSaved<string>('metricType'), 'Metric type should match');
    }); 
