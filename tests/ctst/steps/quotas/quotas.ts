/* eslint-disable no-case-declarations */
import fs from 'fs';
import lockFile from 'proper-lockfile';
import { createHash } from 'crypto';
import { Given, Before, When } from '@cucumber/cucumber';
import Zenko from '../../world/Zenko';
import { Scality, Command, CacheHelper, Constants, Utils } from 'cli-testing';
import { createJobAndWaitForCompletion } from 'steps/utils/kubernetes';
import { createBucketWithConfiguration, putObject } from 'steps/utils/utils';

function hashStringAndKeepFirst20Characters(input: string) {
    return createHash('sha256').update(input).digest('hex').slice(0, 20);
}

/**
 * The objective of this hook is to prepare all the buckets and accounts
 * we use during quota checks, so that we avoid running the job multiple
 * times, which affects the performance of the tests.
 * The steps are: create an account, then create a simple bucket
 */
Before({ tags: '@Quotas', timeout: 1200000 }, async function ({ gherkinDocument, pickle }) {
    let initiated = false;
    let releaseLock: (() => Promise<void>) | false = false;
    const output: { [key: string]: { AccessKey: string, SecretKey: string }} = {};
    const world = this as Zenko;

    await Zenko.init(world.parameters);

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
                    output[scenarioWithExampleID] = {
                        AccessKey: CacheHelper.parameters?.AccessKey || Constants.DEFAULT_ACCESS_KEY,
                        SecretKey: CacheHelper.parameters?.SecretKey || Constants.DEFAULT_SECRET_KEY,
                    };
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
    world.parameters.logger?.debug('Scenario key', { key, from: `${pickle.astNodeIds[1]}`, configuration });
    const config = configuration[key];
    world.resetGlobalType();
    // Save the bucket name for the scenario
    world.addToSaved('bucketName', key);
    // Save the account name for the scenario
    Zenko.saveAccountAccessKeys(config.AccessKey, config.SecretKey);
    world.addToSaved('accountName', key);
});

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
    this.resumeAssumedRole();
    const result: Command = await Scality.updateBucketQuota(
        this.parameters,
        this.getCliMode(),
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
    this.resumeAssumedRole();
    const result: Command = await Scality.updateAccountQuota(
        this.parameters,
        this.getCliMode(),
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
