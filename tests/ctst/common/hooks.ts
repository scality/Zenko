import fs from 'fs';
import lockFile from 'proper-lockfile';
import {
    Before,
    After,
    setParallelCanAssign,
    parallelCanAssignHelpers,
} from '@cucumber/cucumber';
import Zenko, { EntityType } from '../world/Zenko';
import { AWSCredentials, Constants, Identity, IdentityEnum, Scality, Utils } from 'cli-testing';
import { cleanAzureContainer, cleanZenkoLocation } from 'steps/azureArchive';
import { cleanS3Bucket } from './common';
import { createJobAndWaitForCompletion } from '../steps/utils/kubernetes';
import { createBucketWithConfiguration, putObject } from '../steps/utils/utils';
import { hashStringAndKeepFirst20Characters } from './utils';

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

/**
 * The objective of this hook is to prepare all the buckets and accounts
 * we use during quota checks, so that we avoid running the job multiple
 * times, which affects the performance of the tests.
 * The steps are: create an account, then create a simple bucket
 */
Before({ tags: '@Quotas', timeout: 1200000 }, async function ({ gherkinDocument, pickle }) {
    const world = this as Zenko;
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
});

After({ tags: '@Quotas' }, async function () {
    // Remove any quota at the end of the scenario, in case
    // the account gets reused, placed after the global After
    // hook to make sure it is executed first.
    const world = this as Zenko;
    // restore account
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
