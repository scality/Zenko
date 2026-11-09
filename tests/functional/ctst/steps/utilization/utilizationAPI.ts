import { When, Then, ITestCaseHookParameter } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import Zenko from '../../world/Zenko';
import { settle } from 'common/result';
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
        
        const userCredentials = this.credentials;

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

        const result = await settle(client.getLatestMetrics(metricType, metricName));
        if (result.error) {
            this.logger.debug('Error retrieving utilization metrics', { err: result.error.message });
        }
        this.setResult(result);
    });

Then('the latest utilization metrics are retrieved',
    function (this: Zenko) {
        const { data: response, error } = this.getResult<ScubaMetrics>();
        assert.ifError(error);
        assert(response, 'Expected utilization metrics');
        this.logger.debug('Utilization metrics', { response });

        assert.ok(response.objectsTotal >= 0, 'Bucket metrics should contain objectCount');
        assert.ok(response.bytesTotal >= 0, 'Bucket metrics should contain bytesTotal');
        assert.ok(response.metricsClass === this.getSaved<string>('metricType'), 'Metric type should match');
    }); 
