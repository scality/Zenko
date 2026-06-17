import { When, Then, ITestCaseHookParameter } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import Zenko from '../../world/Zenko';
import ScubaClient, { ScubaMetrics } from 'scubaclient';
import { prepareMetricsScenarios } from '../../common/utils';

export async function prepareUtilizationScenarios(world: Zenko, scenarioConfiguration: ITestCaseHookParameter) {
    await prepareMetricsScenarios(world, scenarioConfiguration, {
        versioning: '',
        jobNamespace: 'utilization-setup',
        jobName: 'end2end-ops-count-items'
    });
}

When('the user retrieves utilization metrics using scubaclient for metric type {string}',
    async function (this: Zenko, metricType: string) {
        const accountName = this.getSaved<string>('accountName');
        
        const userCredentials = this.awsClients.getCredentials();

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
            this.saveS3Result(await client.getLatestMetrics(metricType, metricName));
        } catch (err: unknown) {
            this.logger.debug('Error retrieving utilization metrics', { err: (err as Error).message });
            this.saveS3Error(err);
        }
    });

Then('the latest utilization metrics are retrieved',
    function (this: Zenko) {
        const outcome = this.getS3Outcome<ScubaMetrics>();
        assert.ok(outcome.ok, `Expected no error but got: ${!outcome.ok ? outcome.error.message : ''}`);

        this.logger.debug('Utilization metrics', { data: outcome.ok ? outcome.data : null });

        const response = outcome.data!;
        assert.ok(response.objectsTotal >= 0, 'Bucket metrics should contain objectCount');
        assert.ok(response.bytesTotal >= 0, 'Bucket metrics should contain bytesTotal');
        assert.ok(response.metricsClass === this.getSaved<string>('metricType'), 'Metric type should match');
    }); 
