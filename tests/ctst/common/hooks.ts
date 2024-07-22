import {
    Before,
    After,
    setParallelCanAssign,
    parallelCanAssignHelpers,
} from '@cucumber/cucumber';
import Zenko from '../world/Zenko';
import { Identity } from 'cli-testing';
import { prepareQuotaScenarios, teardownQuotaScenarios } from 'steps/quotas/quotas';
import ZenkoDrctl from 'steps/dr/drctl';

// HTTPS should not cause any error for CTST
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { atMostOnePicklePerTag } = parallelCanAssignHelpers;
const noParallelRun = atMostOnePicklePerTag(['@AfterAll']);

setParallelCanAssign(noParallelRun);

Before(async function (this: Zenko) {
    this.resetSaved();
    Identity.resetIdentity();
    await Zenko.init(this.parameters);
});

Before({ tags: '@PRA' }, function () {
    const world = this as Zenko;
    world.zenkoDrCtl = new ZenkoDrctl(world);
});

Before({ tags: '@Quotas', timeout: 1200000 }, async function (scenarioOptions) {
    await prepareQuotaScenarios(this as Zenko, scenarioOptions);
});

After({ tags: '@Quotas' }, async function () {
    await teardownQuotaScenarios(this as Zenko);
});

export default Zenko;
