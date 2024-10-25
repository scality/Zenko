import { ListObjectVersionsOutput } from '@aws-sdk/client-s3';
import { Given, setDefaultTimeout, Then, When } from '@cucumber/cucumber';
import { Constants, Identity, IdentityEnum, S3, Utils } from 'cli-testing';
import Zenko from 'world/Zenko';
import { safeJsonParse } from './utils';
import assert from 'assert';
import { Admin, Kafka } from 'kafkajs';
import {
    createBucketWithConfiguration,
    putObject,
    runActionAgainstBucket,
    getObjectNameWithBackendFlakiness,
    verifyObjectLocation,
    restoreObject,
    addTransitionWorkflow,
} from 'steps/utils/utils';
import { ActionPermissionsType } from 'steps/bucket-policies/utils';
import constants from './constants';

setDefaultTimeout(Constants.DEFAULT_TIMEOUT);

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
    if (world.getSaved<string>('objectLockMode') === constants.complianceRetention) {
        // Do not try to clean a bucket with compliance retention
        return;
    }
    Identity.useIdentity(IdentityEnum.ACCOUNT, world.getSaved<string>('accountName') ||
        world.parameters.AccountName);
    world.resetCommand();
    world.addCommandParameter({ bucket: bucketName });
    const createdObjects = world.getCreatedObjects();
    if (createdObjects !== undefined) {
        const results = await S3.listObjectVersions(world.getCommandParameters());
        const res = safeJsonParse<ListObjectVersionsOutput>(results.stdout);
        if (!res.ok) {
            throw results;
        }
        const versions = res.result!.Versions || [];
        const deleteMarkers = res.result!.DeleteMarkers || [];
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

async function addMultipleObjects(this: Zenko, numberObjects: number,
    objectName: string, sizeBytes: number, userMD?: string) {
    let lastResult = null;
    for (let i = 1; i <= numberObjects; i++) {
        this.resetCommand();
        const objectNameFinal = getObjectNameWithBackendFlakiness.call(this, `${objectName}-${i}`) ||
            Utils.randomString();
        if (sizeBytes > 0) {
            this.addToSaved('objectSize', sizeBytes);
        }
        if (userMD) {
            this.addToSaved('userMetadata', userMD);
        }
        lastResult = await putObject(this, objectNameFinal);
    }
    return lastResult;
}

async function addUserMetadataToObject(this: Zenko, objectName: string | undefined, userMD: string) {
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

async function getTopicsOffsets(topics: string[], kafkaAdmin: Admin) {
    const offsets = [];
    for (const topic of topics) {
        const partitions: ({ high: string; low: string; })[] =
            await kafkaAdmin.fetchTopicOffsets(topic);
        offsets.push({ topic, partitions });
    }
    return offsets;
}

Given('an account', async function (this: Zenko) {
    await this.createAccount();
});

async function createBucket(world: Zenko, versioning: string, bucketName: string) {
    world.resetCommand();
    world.addToSaved('bucketName', bucketName);
    world.addCommandParameter({ bucket: bucketName });
    await S3.createBucket(world.getCommandParameters());
    world.addToSaved('bucketVersioning', versioning);
    if (versioning !== 'Non versioned') {
        const versioningConfiguration = versioning === 'Versioned' ? 'Enabled' : 'Suspended';
        world.addCommandParameter({ versioningConfiguration: `Status=${versioningConfiguration}` });
        await S3.putBucketVersioning(world.getCommandParameters());
    }
}

Given('a {string} bucket with dot', async function (this: Zenko, versioning: string) {
    const preName = this.getSaved<string>('accountName') ||
        this.parameters.AccountName || Constants.ACCOUNT_NAME;
    await createBucket(this, versioning,
        `${preName}.${Constants.BUCKET_NAME_TEST}${Utils.randomString()}`.toLocaleLowerCase());
});

Given('a {string} bucket', async function (this: Zenko, versioning: string) {
    const preName = this.getSaved<string>('accountName') ||
        this.parameters.AccountName || Constants.ACCOUNT_NAME;
    await createBucket(this, versioning,
        `${preName}${Constants.BUCKET_NAME_TEST}${Utils.randomString()}`.toLocaleLowerCase());
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

Given('{int} objects {string} of size {int} bytes on {string} site',
    async function (this: Zenko, numberObjects: number, objectName: string, sizeBytes: number, site: string) {
        this.resetCommand();

        if (site === 'DR') {
            Identity.useIdentity(IdentityEnum.ACCOUNT, `${Zenko.sites['source'].accountName}-replicated`);
        } else {
            Identity.useIdentity(IdentityEnum.ACCOUNT, Zenko.sites['source'].accountName);
        }
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
        const versionId = this.getLatestObjectVersion(objectName);
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
        const versionId = this.getLatestObjectVersion(objectName);
        if (versionId) {
            this.addCommandParameter({ versionId });
        }
        await S3.getObjectTagging(this.getCommandParameters()).then(res => {
            const parsed = safeJsonParse<{ TagSet: [{ Key: string, Value: string }] | undefined }>(res.stdout);
            assert(parsed.result!.TagSet?.some(tag => tag.Key === tagKey && tag.Value === tagValue));
        });
    });

Then('object {string} should have the user metadata with key {string} and value {string}',
    async function (this: Zenko, objectName: string, userMDKey: string, userMDValue: string) {
        this.resetCommand();
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        this.addCommandParameter({ key: objectName });
        const versionId = this.getLatestObjectVersion(objectName);
        if (versionId) {
            this.addCommandParameter({ versionId });
        }
        const res = await S3.headObject(this.getCommandParameters());
        assert.ifError(res.stderr);
        assert(res.stdout);
        const parsed = safeJsonParse<{ Metadata: { [key: string]: string } | undefined }>(res.stdout);
        assert(parsed.ok);
        assert(parsed.result!.Metadata);
        assert(parsed.result!.Metadata[userMDKey]);
        assert(parsed.result!.Metadata[userMDKey] === userMDValue);
    });

// add a transition workflow to a bucket
Given('a transition workflow to {string} location', async function (this: Zenko, location: string) {
    await addTransitionWorkflow.call(this, location);
});

When('i restore object {string} for {int} days', async function (this: Zenko, objectName: string, days: number) {
    await restoreObject.call(this, objectName, days);
});

// wait for object to transition to a location or get restored from it
Then('object {string} should be {string} and have the storage class {string}',
    { timeout: 130000 }, verifyObjectLocation);

When('i delete object {string}', async function (this: Zenko, objectName: string) {
    const objName = getObjectNameWithBackendFlakiness.call(this, objectName) || this.getSaved<string>('objectName');
    this.resetCommand();
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    this.addCommandParameter({ key: objName });
    const versionId = this.getLatestObjectVersion(objName);
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

Then('kafka consumed messages should not take too much place on disk', { timeout: -1 },
    async function (this: Zenko) {
        const kfkcIntervalSeconds = parseInt(this.parameters.KafkaCleanerInterval);
        const checkInterval = kfkcIntervalSeconds * (1000 + 5000);

        const timeoutID = setTimeout(() => {
            assert.fail('Kafka cleaner did not clean the topics within the expected time');
        }, checkInterval * 10); // Timeout after 10 Kafka cleaner intervals

        try {
            const ignoredTopics = ['dead-letter'];
            const kafkaAdmin = new Kafka({ brokers: [this.parameters.KafkaHosts] }).admin();
            const topics: string[] = (await kafkaAdmin.listTopics())
                .filter(t => (t.includes(this.parameters.InstanceID) &&
                    !ignoredTopics.some(e => t.includes(e))));

            const previousOffsets = await getTopicsOffsets(topics, kafkaAdmin);

            while (topics.length > 0) {
                // Checking topics offsets before kafkacleaner passes to be sure kafkacleaner works
                // This function can be improved by consuming messages and
                // verify that the timestamp is not older than last kafkacleaner run
                // Instead of waiting for a fixed amount of time,
                // we could also check for metrics to see last kafkacleaner run

                // 3 seconds added to be sure kafkacleaner had time to process
                await Utils.sleep(checkInterval);

                const newOffsets = await getTopicsOffsets(topics, kafkaAdmin);

                for (let i = 0; i < topics.length; i++) {
                    this.logger.debug('Checking topic', { topic: topics[i] });
                    let topicCleaned = false;
                    for (let j = 0; j < newOffsets[i].partitions.length; j++) {
                        const newOffsetPartition = newOffsets[i].partitions[j];
                        const oldOffsetPartition = previousOffsets[i].partitions[j];

                        if (!oldOffsetPartition) {
                            continue;
                        }

                        // Ensure we're accessing the correct partition details
                        const lowOffsetIncreased = parseInt(newOffsetPartition.low) >
                            parseInt(oldOffsetPartition.low);
                        // We tolerate one message not being cleaned, as it can be due to the
                        // message being consumed during the check
                        const allMessagesCleaned = parseInt(newOffsetPartition.low) + 1 >=
                            parseInt(newOffsetPartition.high);

                        // We consider one topic as cleaned if kafkacleaner affected the
                        // offset (low) or all messages are cleaned.
                        if (lowOffsetIncreased || allMessagesCleaned) {
                            topicCleaned = true;
                        } else {
                            // Log warning if the condition is not met for this partition
                            this.logger.debug(`Partition ${j} of topic ${topics[i]} not cleaned as expected`, {
                                previousOffsets: oldOffsetPartition,
                                newOffsets: newOffsetPartition,
                            });
                        }
                    }
                    if (topicCleaned) {
                        // All partitions of the topic are cleaned, remove from array
                        topics.splice(i, 1);
                    }
                }
            }

            // If a topic remains in this array, it means it has not been cleaned
            assert(topics.length === 0, `Topics ${topics.join(', ')} still have not been cleaned`);
        } finally {
            clearTimeout(timeoutID);
        }
    });

Given('an object {string} that {string}', async function (this: Zenko, objectName: string, objectExists: string) {
    this.resetCommand();
    if (objectExists === 'exists') {
        await putObject(this, objectName);
    }
});

When('the user tries to perform the current S3 action on the bucket {int} times with a {int} ms delay',
    async function (this: Zenko, numberOfRuns: number, delay: number) {
        this.useSavedIdentity();
        const action = {
            ...this.getSaved<ActionPermissionsType>('currentAction'),
        };
        if (action.action.includes('Version') && !action.action.includes('Versioning')) {
            action.action = action.action.replace('Version', '');
            this.addToSaved('currentAction', action);
        }
        for (let i = 0; i < numberOfRuns; i++) {
            // For repeated WRITE actions, we want to change the object name
            if (action.action === 'PutObject') {
                this.addToSaved('objectName', `objectrepeat-${Utils.randomString()}`);
            } else if (action.action === 'CopyObject') {
                this.addToSaved('copyObject', `objectrepeatcopy-${Utils.randomString()}`);
            }
            await runActionAgainstBucket(this, this.getSaved<ActionPermissionsType>('currentAction').action);
            if (this.getResult().err) {
                // stop at any error, the error will be evaluated in a separated step
                return;
            }
            await Utils.sleep(delay);
        }
    });

Then('the API should {string} with {string}', function (this: Zenko, result: string, expected: string) {
    const action = this.getSaved<ActionPermissionsType>('currentAction');
    switch (result) {
    case 'succeed':
        if (action.expectedResultOnAllowTest) {
            assert.strictEqual(
                this.getResult().err?.includes(action.expectedResultOnAllowTest) ||
                    this.getResult().stdout?.includes(action.expectedResultOnAllowTest) ||
                    this.getResult().err === null, true);
        } else {
            assert.strictEqual(!!this.getResult().err, false);
        }
        break;
    case 'fail':
        assert.strictEqual(this.getResult().err?.includes(expected), true);
        break;
    default:
        throw new Error('The API should have a correct expected result defined');
    }
});

Then('the operation finished without error', function (this: Zenko) {
    this.useSavedIdentity();
    assert.strictEqual(!!this.getResult().err, false);
});

Given('an upload size of {int} B for the object {string}', async function (
    this: Zenko,
    size: number,
    objectName: string
) {
    this.addToSaved('objectSize', size);
    if (this.getSaved<boolean>('preExistingObject')) {
        await putObject(this, objectName);
    }
});

When('I PUT an object with size {int}', async function (this: Zenko, size: number) {
    if (size > 0) {
        this.addToSaved('objectSize', size);
    }
    const result = await addMultipleObjects.call(
        this, 1, `object-${Utils.randomString()}`, size);
    this.setResult(result!);
});
