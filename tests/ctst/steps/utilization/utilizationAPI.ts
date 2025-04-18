import { When, Then } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import Zenko from '../../world/Zenko';
import { Identity, IdentityEnum } from 'cli-testing';
import { Command } from 'cli-testing';
import ScubaClient, { ScubaMetrics } from 'scubaclient';

When('the user retrieves utilization metrics using scubaclient for metric type {string}',
    async function (this: Zenko, metricType: string) {
        const identityType = this.getSaved<IdentityEnum>('identityTypeForScenario');
        const identityName = this.getSaved<string>('identityNameForScenario');
        const accountName = this.getSaved<string>('accountNameForScenario');

        const userCredentials = Identity.getCredentialsForIdentity(
            identityType,
            identityName,
            accountName
        );

        if (!userCredentials) {
            throw new Error('User credentials not found');
        }

        this.addToSaved('metricType', metricType);

        const client = new ScubaClient({
            basePath: this.parameters.UtilizationServiceHost,
            port: parseInt(this.parameters.UtilizationServicePort),
            useHttps: false,
            auth: {
                awsV4: {
                    credentials: {
                        accessKeyId: userCredentials.accessKeyId,
                        secretAccessKey: userCredentials.secretAccessKey,
                        sessionToken: userCredentials.sessionToken,
                    },
                    region: 'us-east-1',
                    service: 'sur',
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

        // @ts-expect-error SUR client does not yet has the "location" type listed
        const response = await client.getLatestMetrics(metricType, metricName);
        const command: Command = {
            err: '',
            stdout: JSON.stringify(response),
            stderr: '',
        };
        this.setResult(command);
    });

Then('the latest utilization metrics are retrieved',
    function (this: Zenko) {
        const result = this.getResult();
        assert.strictEqual(result.err, '', `Expected no error but got: ${result.err}`);

        const response = JSON.parse(result.stdout) as ScubaMetrics;
        assert.ok(response.objectsTotal > 0, 'Bucket metrics should contain objectCount');
        assert.ok(response.bytesTotal > 0, 'Bucket metrics should contain bytesTotal');
        assert.ok(response.metricsClass === this.getSaved<string>('metricType'), 'Metric type should match');
    }); 
