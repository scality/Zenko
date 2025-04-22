import { Given, When, ITestCaseHookParameter } from '@cucumber/cucumber';
import Zenko, { EntityType } from '../../world/Zenko';
import { Scality, Command, Utils } from 'cli-testing';
import { prepareMetricsScenarios } from '../../common/utils';
import assert from 'assert';

export async function prepareQuotaScenarios(world: Zenko, scenarioConfiguration: ITestCaseHookParameter) {
    /**
     * The objective of this hook is to prepare all the buckets and accounts
     * we use during quota checks, so that we avoid running the job multiple
     * times, which affects the performance of the tests.
     * The steps are: create an account, then create a simple bucket.
     *
     * The hook is called in the hooks.ts file.
     */
    const isBucketNonVersioned = scenarioConfiguration.gherkinDocument.feature?.tags?.find(
        tag => tag.name === 'NonVersioned') === undefined;
    
    const versioning = isBucketNonVersioned ? '' : 'with';
    
    await prepareMetricsScenarios(world, scenarioConfiguration, {
        versioning,
        jobNamespace: 'quotas-setup',
    });
}

export async function teardownQuotaScenarios(world: Zenko) {
    // Remove any quota at the end of the scenario, in case
    // the account gets reused, placed after the global After
    // hook to make sure it is executed first.
    await world.createAccount();
    await world.setupEntity(EntityType.STORAGE_MANAGER);
    world.addCommandParameter({
        bucket: world.getSaved<string>('bucketName'),
    });
    const resultBucket = await Scality.deleteBucketQuota(
        world.parameters,
        world.getCommandParameters());
    world.logger?.debug('DeleteBucketQuota result', {
        resultBucket,
        parameters: world.getCommandParameters(),
    });
    const resultAccount = await Scality.deleteAccountQuota(world.parameters);

    world.logger?.debug('DeleteAccountQuota result', {
        resultAccount,
        parameters: world.getCommandParameters(),
    });
    if (resultBucket.err || resultAccount.err) {
        throw new Error('Unable to delete quotas');
    }
}

Given('a bucket quota set to {int} B', async function (this: Zenko, quota: number) {
    if (quota === 0) {
        return;
    }
    this.addCommandParameter({
        quota: String(quota),
    });
    this.addCommandParameter({
        bucket: this.getSaved<string>('bucketName'),
    });
    // This API is only valid for storage managers
    this.useSavedIdentity();
    const result: Command = await Scality.updateBucketQuota(
        this.parameters,
        this.getCommandParameters());

    this.logger.debug('UpdateBucketQuota result', {
        result,
    });

    // Ensure the quota is set
    const resultGet: Command = await Scality.getBucketQuota(
        this.parameters,
        this.getCommandParameters());
    this.logger.debug('GetBucketQuota result', {
        resultGet,
    });

    assert(resultGet.stdout.includes(`${quota}`));

    if (result.err) {
        throw new Error(result.err);
    }
});

Given('an account quota set to {int} B', async function (this: Zenko, quota: number) {
    if (quota === 0) {
        return;
    }
    this.addCommandParameter({
        quotaMax: String(quota),
    });
    // This API is only valid for storage managers
    this.useSavedIdentity();
    const result: Command = await Scality.updateAccountQuota(
        this.parameters,
        this.getCommandParameters());

    this.logger.debug('UpdateAccountQuota result', {
        result,
    });

    // Ensure the quota is set
    assert(JSON.parse(result.stdout).quota === quota);

    if (result.err) {
        throw new Error(result.err);
    }
});

When('I wait {int} seconds', async (seconds: number) => {
    await Utils.sleep(seconds * 1000);
});
