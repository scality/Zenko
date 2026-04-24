import { Given, When, Then } from '@cucumber/cucumber';
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

Given('an identity with the {string} keycloak persona', function (this: Zenko, persona: string) {
    this.addToSaved('keycloakPersona', persona);
});

async function fetchStorageUsageReport(world: Zenko) {
    const persona = world.getSaved<string>('keycloakPersona');
    const result = await world.managementAPIRequest(
        'GET',
        `/instance/${Zenko.testsConfig.ZenkoCR.InstanceID}/reporting/usage`,
        {},
        {},
        persona,
    );
    world.addToSaved('lastHttpResponse', result);
    return result;
}

When('the user tries to retrieve the storage usage report', async function (this: Zenko) {
    await fetchStorageUsageReport(this);
});

When('the user retrieves the storage usage report', async function (this: Zenko) {
    const result = await fetchStorageUsageReport(this);
    assert.strictEqual(result.statusCode, 200,
        `Expected status 200 but got ${result.statusCode}`);
});

Then('the storage usage report response has a valid structure', function (this: Zenko) {
    const response = this.getSaved<{ statusCode: number; data: ReportingUsageResponse }>(
        'lastHttpResponse');
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
        'lastHttpResponse');
    const accountNames = this.getSavedIdentities()
        .filter(id => id.identityType === IdentityEnum.ACCOUNT)
        .map(id => id.accountName);
    for (const accountName of accountNames) {
        assert.ok(accountName in response.data.accounts,
            `Account ${accountName} should be present in the report`);
    }
});

Then('the report contains the test account with location {string}', async function (this: Zenko, locationName: string) {
    const response = this.getSaved<{ statusCode: number; data: ReportingUsageResponse }>(
        'lastHttpResponse');
    const accountName = this.getSaved<string>('accountName');

    assert.ok(accountName in response.data.accounts,
        `Account ${accountName} should be present in the report`);

    const accountData = response.data.accounts[accountName];
    assert.ok(locationName in accountData,
        `Location ${locationName} should be present for account ${accountName}`);

    this.addToSaved('reportedLocationUsage', accountData[locationName]);
});

Then('the report shows {int} objects and {int} bytes', function (this: Zenko, objects: number, bytes: number) {
    const usage = this.getSaved<LocationUsage>('reportedLocationUsage');
    assert.strictEqual(usage.objectsTotal, objects,
        `Expected ${objects} objects but got ${usage.objectsTotal}`);
    assert.strictEqual(usage.bytesTotal, bytes,
        `Expected ${bytes} bytes but got ${usage.bytesTotal}`);
});
