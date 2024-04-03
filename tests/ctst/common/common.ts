import fs from 'fs';
import { tmpNameSync } from 'tmp';
import { Given, setDefaultTimeout, Then, When } from '@cucumber/cucumber';
import { Constants, S3, Utils } from 'cli-testing';
import Zenko from 'world/Zenko';
import { extractPropertyFromResults, safeJsonParse } from './utils';
import assert from 'assert';
import { Admin, Kafka } from 'kafkajs';
import { createBucketWithConfiguration, putObject } from 'steps/utils/utils';

setDefaultTimeout(Constants.DEFAULT_TIMEOUT);

type listingObject = {
    Key: string,
    VersionId: string,
}

type listingResult = {
    Versions: listingObject[],
    DeleteMarkers: listingObject[],
}

/**
 * Cleans the created test bucket
 * @param {Zenko} world world object
 * @param {string} bucketName bucket name
 * @returns {void}
 */
export async function cleanS3Bucket(
    world: Zenko,
    bucketName: string,
): Promise<void> {
    if (!bucketName) {
        return;
    }
    world.resetCommand();
    world.addCommandParameter({ bucket: bucketName });
    const createdObjects = world.getSaved<Map<string, string>>('createdObjects');
    if (createdObjects !== undefined) {
        const results = await S3.listObjectVersions(world.getCommandParameters());
        const res = safeJsonParse(results.stdout);
        assert(res.ok);
        const parsedResults = res.result as listingResult;
        const versions = parsedResults.Versions || [];
        const deleteMarkers = parsedResults.DeleteMarkers || [];
        await Promise.all(versions.concat(deleteMarkers).map(obj => {
            world.addCommandParameter({ key: obj.Key });
            world.addCommandParameter({ versionId: obj.VersionId });
            return S3.deleteObject(world.getCommandParameters());
        }));
        world.deleteKeyFromCommand('key');
        world.deleteKeyFromCommand('versionId');
    }
    await S3.deleteBucketLifecycle(world.getCommandParameters());
    await S3.deleteBucket(world.getCommandParameters());
}

/**
 * @param {Zenko} this world object
 * @param {string} objectName object name
 * @returns {string} the object name based on the backend flakyness
 */
function getObjectNameWithBackendFlakiness(this: Zenko, objectName: string) {
    let objectNameFinal;
    const backendFlakinessRetryNumber = this.getSaved<string>('backendFlakinessRetryNumber');
    const backendFlakiness = this.getSaved<string>('backendFlakiness');

    if (!backendFlakiness || !backendFlakinessRetryNumber || !objectName) {
        return objectName;
    }

    switch (backendFlakiness) {
    case 'command':
        objectNameFinal = `${objectName}.scal-retry-command-${backendFlakinessRetryNumber}`;
        break;
    case 'archive':
    case 'restore':
        objectNameFinal = `${objectName}.scal-retry-${backendFlakiness}-job-${backendFlakinessRetryNumber}`;
        break;
    default:
        process.stdout.write(`Unknown backend flakyness ${backendFlakiness}\n`);
        return objectName;
    }
    return objectNameFinal;
}

async function addMultipleObjects(this: Zenko, numberObjects: number,
    objectName: string, sizeBytes: number, userMD?: string) {
    for (let i = 1; i <= numberObjects; i++) {
        const objectNameFinal = getObjectNameWithBackendFlakiness.call(this, `${objectName}-${i}`);

        this.addToSaved('objectName', `${objectNameFinal}` || Utils.randomString());
        const objectPath = tmpNameSync({prefix: this.getSaved<string>('objectName')});
        fs.writeFileSync(objectPath, Buffer.alloc(sizeBytes, this.getSaved<string>('objectName')));
        this.resetCommand();
        this.addCommandParameter({ key: this.getSaved<string>('objectName') });
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        this.addCommandParameter({ body: objectPath });
        if (userMD) {
            this.addCommandParameter({ metadata: JSON.stringify(userMD) });
        }
        process.stdout.write(`Adding object ${objectNameFinal}\n`);
        this.addToSaved('versionId', extractPropertyFromResults(
            await S3.putObject(this.getCommandParameters()), 'VersionId')
        );
        fs.rmSync(objectPath);
        const createdObjects = this.getSaved<Map<string, string>>('createdObjects') || new Map<string, string>();
        createdObjects.set(this.getSaved<string>('objectName'), this.getSaved<string>('versionId'));
        this.addToSaved('createdObjects', createdObjects);
    }
}

async function addUserMetadataToObject(this: Zenko, objectName: string|undefined, userMD: string) {
    const objName = objectName || this.getSaved<string>('objectName');
    const bucketName = this.getSaved<string>('bucketName');
    this.resetCommand();
    this.addCommandParameter({ bucket: bucketName });
    this.addCommandParameter({ key: objName });
    this.addCommandParameter({ copySource: `${bucketName}/${objName}` });
    this.addCommandParameter({ metadata: userMD });
    this.addCommandParameter({ metadataDirective: 'REPLACE' });
    return await S3.copyObject(this.getCommandParameters());
}

async function getTopicsOffsets(topics:string[], kafkaAdmin:Admin) {
    const offsets = [];
    for (const topic of topics) {
        const partitions: ({ high: string; low: string; })[] =
        await kafkaAdmin.fetchTopicOffsets(topic);
        offsets.push({ topic, partitions });
    }
    return offsets;
}

Given('a {string} bucket', async function (this: Zenko, versioning: string) {
    this.resetCommand();
    const preName = this.parameters.AccountName || Constants.ACCOUNT_NAME;
    const bucketName = `${preName}${Constants.BUCKET_NAME_TEST}${Utils.randomString()}`.toLocaleLowerCase();
    this.addToSaved('bucketName', bucketName);
    this.addCommandParameter({ bucket: bucketName });
    await S3.createBucket(this.getCommandParameters());
    this.addToSaved('bucketVersioning', versioning);
    if (versioning !== 'Non versioned') {
        const versioningConfiguration = versioning === 'Versioned' ? 'Enabled' : 'Suspended';
        this.addCommandParameter({ versioningConfiguration: `Status=${versioningConfiguration}` });
        await S3.putBucketVersioning(this.getCommandParameters());
    }
});

Given('an existing bucket {string} {string} versioning, {string} ObjectLock {string} retention mode', async function
(
    this: Zenko,
    bucketName: string,
    withVersioning: string,
    withObjectLock: string,
    retentionMode: string) {
    await createBucketWithConfiguration(this, bucketName, withVersioning, withObjectLock, retentionMode);
});

Given('{int} objects {string} of size {int} bytes',
    async function (this: Zenko, numberObjects: number, objectName: string, sizeBytes: number) {
        await addMultipleObjects.call(this, numberObjects, objectName, sizeBytes);
    });

Given('{int} objects {string} of size {int} bytes with user metadata {string}',
    async function (this: Zenko, numberObjects: number, objectName: string, sizeBytes: number, userMD: string) {
        await addMultipleObjects.call(this, numberObjects, objectName, sizeBytes, userMD);
    });

Given('a tag on object {string} with key {string} and value {string}',
    async function (this: Zenko, objectName: string, tagKey: string, tagValue: string) {
        this.resetCommand();
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        this.addCommandParameter({ key: objectName });
        const versionId = this.getSaved<Map<string, string>>('createdObjects')?.get(objectName);
        if (versionId) {
            this.addCommandParameter({ versionId });
        }
        const tags = JSON.stringify({
            TagSet: [{
                Key: tagKey,
                Value: tagValue,
            }],
        });
        this.addCommandParameter({ tagging: `'${tags}'` });
        await S3.putObjectTagging(this.getCommandParameters());
    });

Then('object {string} should have the tag {string} with value {string}',
    async function (this: Zenko, objectName: string, tagKey: string, tagValue: string) {
        this.resetCommand();
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        this.addCommandParameter({ key: objectName });
        const versionId = this.getSaved<Map<string, string>>('createdObjects')?.get(objectName);
        if (versionId) {
            this.addCommandParameter({ versionId });
        }
        await S3.getObjectTagging(this.getCommandParameters()).then(res => {
            const parsed = safeJsonParse(res.stdout);
            const head = parsed.result as { TagSet: [{Key: string, Value: string}] | undefined };
            assert(head.TagSet?.some(tag => tag.Key === tagKey && tag.Value === tagValue));
        });
    });

Then('object {string} should have the user metadata with key {string} and value {string}',
    async function (this: Zenko, objectName: string, userMDKey: string, userMDValue: string) {
        this.resetCommand();
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        this.addCommandParameter({ key: objectName });
        const versionId = this.getSaved<Map<string, string>>('createdObjects')?.get(objectName);
        if (versionId) {
            this.addCommandParameter({ versionId });
        }
        const res = await S3.headObject(this.getCommandParameters());
        assert.ifError(res.stderr);
        assert(res.stdout);
        const parsed = safeJsonParse(res.stdout);
        assert(parsed.ok);
        const head = parsed.result as { Metadata: {[key: string]: string} | undefined };
        assert(head.Metadata);
        assert(head.Metadata[userMDKey]);
        assert(head.Metadata[userMDKey] === userMDValue);
    });

// add a transition workflow to a bucket
Given('a transition workflow to {string} location', async function (this: Zenko, location: string) {
    let conditionOk = false;
    this.resetCommand();
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    const lifecycleConfiguration = JSON.stringify({
        Rules: [
            {
                Status: 'Enabled',
                Prefix: '',
                Transitions: [
                    {
                        Days: 20,
                        StorageClass: location,
                    },
                ],
            },
        ],
    });
    this.addCommandParameter({
        lifecycleConfiguration,
    });
    const commandParameters = this.getCommandParameters();
    while (!conditionOk) {
        const res = await S3.putBucketLifecycleConfiguration(commandParameters);
        conditionOk = res.err === null;
        // Wait for the transition to be accepted because the deployment of the location's pods can take some time
        await Utils.sleep(5000); 
    }
});

When('i restore object {string} for {int} days', async function (this: Zenko, objectName: string, days: number) {
    const objName = getObjectNameWithBackendFlakiness.call(this, objectName) ||  this.getSaved<string>('objectName');
    this.resetCommand();
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    this.addCommandParameter({ key: objName });
    const versionId = this.getSaved<Map<string, string>>('createdObjects')?.get(objName);
    if (versionId) {
        this.addCommandParameter({ versionId });
    }
    this.addCommandParameter({ restoreRequest: `Days=${days}` });
    await S3.restoreObject(this.getCommandParameters());
});

// wait for object to transition to a location or get restored from it
Then('object {string} should be {string} and have the storage class {string}', { timeout: 130000 },
    async function (this: Zenko, objectName: string, objectTransitionStatus: string, storageClass: string) {
        const objName =
            getObjectNameWithBackendFlakiness.call(this, objectName) || this.getSaved<string>('objectName');
        this.resetCommand();
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        this.addCommandParameter({ key: objName });
        const versionId = this.getSaved<Map<string, string>>('createdObjects')?.get(objName);
        if (versionId) {
            this.addCommandParameter({ versionId });
        }
        let conditionOk = false;
        while (!conditionOk) {
            const res = await S3.headObject(this.getCommandParameters());
            if (res.err) {
                break;
            }
            assert(res.stdout);
            const parsed = safeJsonParse(res.stdout);
            assert(parsed.ok);
            const head = parsed.result as {
                StorageClass: string | undefined,
                Restore: string | undefined,
            };
            const expectedClass = storageClass !== '' ? storageClass : undefined;
            if (head?.StorageClass === expectedClass) {
                conditionOk = true;
            }
            if (objectTransitionStatus == 'restored') {
                const isRestored = !!head?.Restore &&
                    head.Restore.includes('ongoing-request="false", expiry-date=');
                // if restore didn't get initiated fail immediately
                const isPendingRestore = !!head?.Restore &&
                    head.Restore.includes('ongoing-request="true"');
                assert(isRestored || isPendingRestore, 'Restore didn\'t get initiated');
                conditionOk = conditionOk && isRestored;
            } else if (objectTransitionStatus == 'cold') {
                conditionOk = conditionOk && !head?.Restore;
            }
            await Utils.sleep(3000);
        }
        assert(conditionOk);
    });

When('i delete object {string}', async function (this: Zenko, objectName: string) {
    const objName = getObjectNameWithBackendFlakiness.call(this, objectName) ||  this.getSaved<string>('objectName');
    this.resetCommand();
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    this.addCommandParameter({ key: objName });
    const versionId = this.getSaved<Map<string, string>>('createdObjects')?.get(objName);
    if (versionId) {
        this.addCommandParameter({ versionId });
    }
    await S3.deleteObject(this.getCommandParameters());
});

Then('i {string} be able to add user metadata to object {string}',
    async function (this: Zenko, expectedResult: string, objectName: string) {
        const res = await addUserMetadataToObject.call(this, objectName, 'x-amz-meta-test=test');
        if (expectedResult === 'should not') {
            assert(res.err?.includes('InvalidObjectState'));
        } else {
            assert.ifError(res.err);
        }
    });

Then('kafka consumed messages should not take too much place on disk',
    async function (this: Zenko) {
        const ignoredTopics = ['dead-letter'];
        const kafkaAdmin = new Kafka({ brokers: [this.parameters.KafkaHosts] }).admin();
        const topics: string[] = (await kafkaAdmin.listTopics())
            .filter(t => (t.includes(this.parameters.InstanceID) &&
            !ignoredTopics.some(e => t.includes(e))));
        const previousOffsets = await getTopicsOffsets(topics, kafkaAdmin);

        const seconds = parseInt(this.parameters.KafkaCleanerInterval);

        // Checking topics offsets before kafkacleaner passes to be sure kafkacleaner works
        // This function can be improved by consuming messages and
        // verify that the timestamp is not older than last kafkacleaner run
        // Instead of waiting for a fixed amount of time,
        // we could also check for metrics to see last kafkacleaner run
        
        // 10 seconds added to be sure kafkacleaner had time to process
        await Utils.sleep(seconds * 1000 + 10000);

        const newOffsets = await getTopicsOffsets(topics, kafkaAdmin);

        for (let i = 0; i < topics.length; i++) {
            process.stdout.write(`\nChecking topic ${topics[i]}\n`);
            for (let j = 0; j < newOffsets[i].partitions.length; j++) {
                // Checking that the min offset has increased due to kafkacleaner
                // or that it didn't need to change because there was no new messages
                assert.ok(newOffsets[i].partitions[j].low > previousOffsets[i].partitions[j].low ||
                    newOffsets[i].partitions[j].high === newOffsets[i].partitions[j].low,
                `Topic ${topics[i]} partition ${j} offset has not increased,
                previousOffsets: ${previousOffsets[i].partitions[j].low} / ${previousOffsets[i].partitions[j].high},
                newOffsets: ${newOffsets[i].partitions[j].low} / ${newOffsets[i].partitions[j].high}`);
            }
        }
    });

Given('an object {string} that {string}', async function (this: Zenko, objectName: string, objectExists: string) {
    this.resetCommand();
    if (objectExists === 'exists') {
        await putObject(this, objectName);
    }
});
