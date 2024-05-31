import {
    Before,
    After,
    defineParameterType,
    Given,
    setParallelCanAssign,
    parallelCanAssignHelpers,
} from '@cucumber/cucumber';
import Zenko, { EntityType } from '../world/Zenko';
import { Scality } from 'cli-testing';
// HTTPS should not cause any error for CTST
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { atMostOnePicklePerTag } = parallelCanAssignHelpers;
const noParallelRun = atMostOnePicklePerTag(['@AfterAll']);

setParallelCanAssign(noParallelRun);

Before(async function (this: Zenko) {
    await Zenko.init(this.parameters);
});

After(function (this: Zenko) {
    this.resetSaved();
});

After({ tags: '@Quotas' }, async function () {
    // Remove any quota at the end of the scenario, in case
    // the account gets reused, placed after the global After
    // hook to make sure it is executed first.
    const world = this as Zenko;
    // restore account
    await world.createAccount();
    await world.setupEntity(EntityType.STORAGE_MANAGER);
    world.resumeAssumedRole();
    world.addCommandParameter({
        bucket: world.getSaved<string>('bucketName'),
    });
    const resultBucket = await Scality.deleteBucketQuota(
        world.parameters,
        world.getCliMode(),
        world.getCommandParameters());
    world.parameters.logger?.debug('DeleteBucketQuota result', {
        resultBucket,
        parameters: world.getCommandParameters(),
    });
    const resultAccount = await Scality.deleteAccountQuota(
        world.parameters,
        world.getCliMode());

    world.parameters.logger?.debug('DeleteAccountQuota result', {
        resultAccount,
        parameters: world.getCommandParameters(),
    });
    if (resultBucket.err || resultAccount.err) {
        throw new Error('Unable to delete quotas');
    }
});

export default Zenko;
