import { When, Then } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import Zenko from '../../world/Zenko';
import { IdentityEnum } from 'cli-testing';

interface LocationUsage {
    bytesTotal: number;
    objectsTotal: number;
}

interface ReportingUsageResponse {
    isTruncated: boolean;
    marker: string | null;
    accounts: Record<string, Record<string, LocationUsage>>;
}

When('the user retrieves the storage usage report', async function (this: Zenko) {
        const result = await this.managementAPIRequest(
            'GET',
            `/instance/${this.parameters.InstanceID}/reporting/usage`,
        );
        this.addToSaved('reportingResponse', result);
    });

When('the user retrieves the storage usage report as a data consumer user', async function (this: Zenko) {
        const result = await this.managementAPIRequest(
            'GET',
            `/instance/${this.parameters.InstanceID}/reporting/usage`,
            {},
            {},
            this.parameters.DataConsumerUsername || 'data_consumer',
        );
        this.addToSaved('reportingResponse', result);
    });

Then('the storage usage report http response code is {int}', function (this: Zenko, expectedStatus: number) {
        const response = this.getSaved<{ statusCode: number }>('reportingResponse');
        assert.strictEqual(response.statusCode, expectedStatus,
            `Expected status ${expectedStatus} but got ${response.statusCode}`);
    });

Then('the storage usage report response has a valid structure', function (this: Zenko) {
        const response = this.getSaved<{ statusCode: number; data: ReportingUsageResponse }>(
            'reportingResponse');
        const data = response.data;
        assert.strictEqual(typeof data.isTruncated, 'boolean',
            'isTruncated should be a boolean');
        assert.ok(typeof data.marker === 'string' || data.marker === null,
            'marker should be a string or null');
        assert.strictEqual(typeof data.accounts, 'object',
            'accounts should be an object');
    });

Then('the storage usage report contains the additional accounts', async function (this: Zenko) {
        const response = this.getSaved<{ statusCode: number; data: ReportingUsageResponse }>(
            'reportingResponse');
        const accountNames = this.getSavedIdentities()
            .filter(id => id.identityType === IdentityEnum.ACCOUNT)
            .map(id => id.accountName);
        for (const accountName of accountNames) {
            assert.ok(accountName in response.data.accounts,
                `Account ${accountName} should be present in the report`);
        }
    });

Then('the storage usage report contains the test account with location {string}', async function (this: Zenko, locationName: string) {
        const response = this.getSaved<{ statusCode: number; data: ReportingUsageResponse }>(
            'reportingResponse');
        const accountName = this.getSaved<string>('accountName');

        assert.ok(accountName in response.data.accounts,
            `Account ${accountName} should be present in the report`);

        const accountData = response.data.accounts[accountName];
        assert.ok(locationName in accountData,
            `Location ${locationName} should be present for account ${accountName}`);

        this.addToSaved('reportedLocationUsage', accountData[locationName]);
    });

Then('the location metrics show {int} objects and {int} bytes', function (this: Zenko, expectedObjects: number, expectedBytes: number) {
        const usage = this.getSaved<LocationUsage>('reportedLocationUsage');
        assert.strictEqual(usage.objectsTotal, expectedObjects,
            `Expected ${expectedObjects} objects but got ${usage.objectsTotal}`);
        assert.strictEqual(usage.bytesTotal, expectedBytes,
            `Expected ${expectedBytes} bytes but got ${usage.bytesTotal}`);
    });
