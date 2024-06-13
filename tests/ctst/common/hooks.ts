import {
    Before,
    After,
    setParallelCanAssign,
    parallelCanAssignHelpers,
} from '@cucumber/cucumber';
import Zenko from '../world/Zenko';
import { Identity } from 'cli-testing';
import { prepareQuotaScenarios, quotaScenarioteardown } from 'steps/quotas/quotas';
import { cleanS3Bucket } from './common';
import { cleanAzureContainer, cleanZenkoLocation } from 'steps/azureArchive';

// HTTPS should not cause any error for CTST
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { atMostOnePicklePerTag } = parallelCanAssignHelpers;
const noParallelRun = atMostOnePicklePerTag(['@AzureArchive', '@Dmf', '@AfterAll']);

setParallelCanAssign(noParallelRun);

Before(async function (this: Zenko) {
    this.resetSaved();
    Identity.resetIdentity();
    await Zenko.init(this.parameters);
});

Before({ tags: '@Quotas', timeout: 1200000 }, async function (scenarioOptions) {
    await prepareQuotaScenarios(this as Zenko, scenarioOptions);
});

After({ tags: '@Quotas' }, async function () {
    await quotaScenarioteardown(this as Zenko);
});

After({ tags: '@AzureArchive' }, async function (this: Zenko) {
    await cleanS3Bucket(
        this,
        this.getSaved<string>('bucketName'),
    );
    await cleanZenkoLocation(
        this,
        this.getSaved<string>('locationName'),
    );
    await cleanAzureContainer(
        this,
        this.getSaved<string>('bucketName'),
    );
});

export default Zenko;
