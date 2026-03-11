import {
    Before,
    After,
    setParallelCanAssign,
    parallelCanAssignHelpers,
    ITestCaseHookParameter,
} from '@cucumber/cucumber';
import Zenko from '../world/Zenko';
import { CacheHelper, Identity } from 'cli-testing';
import { prepareQuotaScenarios, teardownQuotaScenarios } from 'steps/quotas/quotas';
import { prepareUtilizationScenarios } from 'steps/utilization/utilizationAPI';
import { prepareMetricsScenarios } from './utils';
import { cleanS3Bucket } from './common';
import { cleanAzureContainer, cleanZenkoLocation } from 'steps/azureArchive';
import { displayDebuggingInformation, preparePRA } from 'steps/pra';
import {
    cleanupAccount,
} from './utils';

import 'cli-testing/hooks/KeycloakSetup';
import 'cli-testing/hooks/Logger';
import 'cli-testing/hooks/versionTags';

// HTTPS should not cause any error for CTST
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { atMostOnePicklePerTag } = parallelCanAssignHelpers;

export const replicationLockTags = [
    '@Lockawsbackendreplicationctstfail',
];
const noParallelRun = atMostOnePicklePerTag([
    '@AfterAll',
    '@PRA',
    '@ColdStorage',
    ...replicationLockTags
]);

setParallelCanAssign(noParallelRun);

Before(async function (this: Zenko, scenario: ITestCaseHookParameter) {
    this.resetSaved();
    Identity.resetIdentity();
    // Store scenario tags for access in step definitions
    const scenarioTags = scenario.pickle.tags?.map(tag => tag.name) || [];
    this.addToSaved('scenarioTags', scenarioTags);
    await Zenko.init(this.parameters);
});

Before({ tags: '@PRA' }, function () {
    preparePRA(this as Zenko);
});

After({ tags: '@PRA' }, async function (this, results) {
    if (results.result?.status === 'FAILED') {
        await displayDebuggingInformation(this as Zenko);
    }
});

Before({ tags: '@Quotas', timeout: 1200000 }, async function (scenarioOptions) {
    await prepareQuotaScenarios(this as Zenko, scenarioOptions);
});

Before({ tags: '@UtilizationAPI', timeout: 1200000 }, async function (scenarioOptions) {
    await prepareUtilizationScenarios(this as Zenko, scenarioOptions);
});

Before({ tags: '@PrepareStorageUsageReportingScenarios', timeout: 1200000 }, async function (scenarioOptions) {
    await prepareMetricsScenarios(this as Zenko, scenarioOptions, {
        versioning: '',
        jobNamespace: 'storage-usage-reporting-setup',
        jobName: 'end2end-ops-count-items',
        objectSize: 200,
        objectCount: 3,
    });
});

After(async function (this: Zenko, results) {
    // Reset any configuration set on the endpoint (ssl, port)
    CacheHelper.parameters.ssl = this.parameters.ssl;
    CacheHelper.parameters.port = this.parameters.port;
    if (results.result?.status === 'FAILED') {
        this.logger.warn('bucket was not cleaned for test', {
            bucket: this.getSaved<string>('bucketName'),
        });
        return;
    }
    await cleanS3Bucket(
        this,
        this.getSaved<string>('bucketName'),
    );
});

After({ tags: '@Quotas' }, async function (this: Zenko, results) {
    if (results.result?.status === 'FAILED') {
        this.logger.warn('quota was not cleaned for test', {
            bucket: this.getSaved<string>('bucketName'),
        });
        return;
    }
    await teardownQuotaScenarios(this as Zenko);
});

After({ tags: '@AzureArchive' }, async function (this: Zenko) {
    await cleanZenkoLocation(
        this,
        this.getSaved<string>('locationName'),
    );
    await cleanAzureContainer(
        this,
        this.getSaved<string>('bucketName'),
    );
});

After({ tags: '@BP-ASSUME_ROLE_USER_CROSS_ACCOUNT'}, async function (this: Zenko, results) {
    const crossAccountName = this.getSaved<string>('crossAccountName');

    if (results.result?.status === 'FAILED' || !crossAccountName) {
        this.logger.warn('cross account was not cleaned for test', {
            crossAccountName,
        });
        return;
    }
    await cleanupAccount(this, crossAccountName);
});

export default Zenko;
