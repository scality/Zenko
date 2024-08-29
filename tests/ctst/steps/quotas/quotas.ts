 
import fs from 'fs';
import lockFile from 'proper-lockfile';
import { Given, When, ITestCaseHookParameter } from '@cucumber/cucumber';
import Zenko, { EntityType } from '../../world/Zenko';
import { Scality, Command, Utils, AWSCredentials, Constants, Identity, IdentityEnum } from 'cli-testing';
import { createJobAndWaitForCompletion } from '../utils/kubernetes';
import { createBucketWithConfiguration, putObject } from '../utils/utils';
import { hashStringAndKeepFirst20Characters } from 'common/utils';

export async function prepareQuotaScenarios(world: Zenko, scenarioConfiguration: ITestCaseHookParameter) {
    /**
     * The objective of this hook is to prepare all the buckets and accounts
     * we use during quota checks, so that we avoid running the job multiple
     * times, which affects the performance of the tests.
     * The steps are: create an account, then create a simple bucket.
     *
     * The hook is called in the hooks.ts file.
     */
    const { gherkinDocument, pickle } = scenarioConfiguration;
    let initiated = false;
    let releaseLock: (() => Promise<void>) | false = false;
    const output: Record<string, AWSCredentials> = {};

    const featureName = gherkinDocument.feature?.name?.replace(/ /g, '-').toLowerCase() || 'quotas';
    const filePath = `/tmp/${featureName}`;

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({
            ready: false,
        }));
    } else {
        initiated = true;
    }

    if (!initiated) {
        try {
            releaseLock = await lockFile.lock(filePath, { stale: Constants.DEFAULT_TIMEOUT / 2 });
        } catch (err) {
            releaseLock = false;
        }
    }

    if (releaseLock) {
        const isBucketNonVersioned = gherkinDocument.feature?.tags?.find(
            tag => tag.name === 'NonVersioned') === undefined;
        for (const scenario of gherkinDocument.feature?.children || []) {
            for (const example of scenario.scenario?.examples || []) {
                for (const values of example.tableBody || []) {
                    const scenarioWithExampleID = hashStringAndKeepFirst20Characters(`${values.id}`);
                    await world.createAccount(scenarioWithExampleID, true);
                    await createBucketWithConfiguration(world, scenarioWithExampleID,
                        isBucketNonVersioned ? '' : 'with');
                    await putObject(world);
                    output[scenarioWithExampleID] = Identity.getCurrentCredentials()!;
                }
            }
        }

        await createJobAndWaitForCompletion(world, 'end2end-ops-count-items', 'quotas-setup');
        // This 2s sleep ensures that the cloudserver instances detected
        // the metrics successfully, which enables the quotas.
        await Utils.sleep(2000);
        fs.writeFileSync(filePath, JSON.stringify({
            ready: true,
            ...output,
        }));

        await releaseLock();
    } else {
        while (!fs.existsSync(filePath)) {
            await Utils.sleep(100);
        }

        let configuration: { ready: boolean } = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { ready: boolean };
        while (!configuration.ready) {
            await Utils.sleep(100);
            configuration = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { ready: boolean };
        }
    }

    const configuration: typeof output = JSON.parse(fs.readFileSync(`/tmp/${featureName}`, 'utf8')) as typeof output;
    const key = hashStringAndKeepFirst20Characters(`${pickle.astNodeIds[1]}`);
    world.logger.debug('Scenario key', { key, from: `${pickle.astNodeIds[1]}`, configuration });
    // Save the bucket name for the scenario
    world.addToSaved('bucketName', key);
    world.addToSaved('accountName', key);
    // Save the account name for the scenario
    Identity.addIdentity(IdentityEnum.ACCOUNT, key, configuration[key], undefined, true, true);
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

    if (result.err) {
        throw new Error(result.err);
    }
});

When('I wait {int} seconds', async (seconds: number) => {
    await Utils.sleep(seconds * 1000);
});
