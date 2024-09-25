import {
    Before,
    After,
    setParallelCanAssign,
    parallelCanAssignHelpers,
} from '@cucumber/cucumber';
import Zenko from '../world/Zenko';
import { Identity } from 'cli-testing';
import { prepareQuotaScenarios, teardownQuotaScenarios } from 'steps/quotas/quotas';
import { displayDebuggingInformation, preparePRA } from 'steps/pra';
import {
    cleanupAccount,
} from './utils';
import { cleanS3Bucket } from './common';

// HTTPS should not cause any error for CTST
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { atMostOnePicklePerTag } = parallelCanAssignHelpers;
const noParallelRun = atMostOnePicklePerTag(['@AfterAll', '@PRA', '@ColdStorage']);

setParallelCanAssign(noParallelRun);

Before(async function (this: Zenko) {
    this.resetSaved();
    Identity.resetIdentity();
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

After(async function (this: Zenko, results) {
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

After({ tags: '@Quotas' }, async function () {
    await teardownQuotaScenarios(this as Zenko);
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
