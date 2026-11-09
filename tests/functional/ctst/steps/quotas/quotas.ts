import { Given, When, ITestCaseHookParameter } from '@cucumber/cucumber';
import Zenko, { EntityType } from '../../world/Zenko';
import { DeleteBucketQuotaCommand, GetBucketQuotaCommand, UpdateBucketQuotaCommand } from '@scality/cloudserverclient';
import { settle } from 'common/result';
import { prepareMetricsScenarios, sleep } from '../../common/utils';
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
    const resultBucket = await settle(world.bucketQuota.send(new DeleteBucketQuotaCommand({
        Bucket: world.getSaved<string>('bucketName'),
    })));
    world.logger?.debug('DeleteBucketQuota result', { resultBucket });
    const resultAccount = await settle(world.vaultAccount.deleteAccountQuota());
    world.logger?.debug('DeleteAccountQuota result', { resultAccount });
    if (resultBucket.error || resultAccount.error) {
        throw new Error('Unable to delete quotas');
    }
}

Given('a bucket quota set to {int} B', async function (this: Zenko, quota: number) {
    if (quota === 0) {
        return;
    }
    const bucket = this.getSaved<string>('bucketName');
    // This API is only valid for storage managers
    this.useSavedIdentity();
    await this.bucketQuota.send(new UpdateBucketQuotaCommand({ Bucket: bucket, Quota: quota }));

    // Ensure the quota is set
    const { Quota } = await this.bucketQuota.send(new GetBucketQuotaCommand({ Bucket: bucket }));
    assert.strictEqual(Quota, quota);
});

Given('an account quota set to {int} B', async function (this: Zenko, quota: number) {
    if (quota === 0) {
        return;
    }
    // This API is only valid for storage managers
    this.useSavedIdentity();
    const result = await this.vaultAccount.updateAccountQuota(quota);
    this.logger.debug('UpdateAccountQuota result', { result });

    // Ensure the quota is set
    assert.strictEqual(result.quota, String(quota));
});

When('I wait {int} seconds', async (seconds: number) => {
    await sleep(seconds * 1000);
});
