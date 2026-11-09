import {
    CopyObjectCommand,
    CreateBucketCommand,
    DeleteBucketCommand,
    DeleteBucketLifecycleCommand,
    DeleteBucketReplicationCommand,
    DeleteObjectCommand,
    GetObjectTaggingCommand,
    HeadObjectCommand,
    PutBucketVersioningCommand,
    PutObjectTaggingCommand,
} from '@aws-sdk/client-s3';
import { Given, setDefaultTimeout, Then, When } from '@cucumber/cucumber';
import { Identity, IdentityEnum } from 'cli-testing';
import Zenko from 'world/Zenko';
import { parseGoDuration, sleep, randomString } from './utils';
import { failedWith, settle, succeededOrFailedWith } from './result';
import assert from 'assert';
import { Admin } from '@platformatic/kafka';
import {
    createBucketWithConfiguration,
    putMpuObject,
    copyObject,
    putObject,
    runActionAgainstBucket,
    getObjectNameWithBackendFlakiness,
    parseMetadata,
    listAllObjectVersions,
    verifyObjectLocation,
    restoreObject,
    addTransitionWorkflow,
    putBucketReplication,
} from 'steps/utils/utils';
import { ActionPermissionsType } from 'steps/bucket-policies/utils';
import constants from './constants';

setDefaultTimeout(constants.DEFAULT_TIMEOUT);

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
    // Best effort: objects under retention cannot be deleted, so neither can their bucket
    const bestEffort = async (what: string, request: Promise<unknown>) => {
        const { error } = await settle(request);
        if (error) {
            world.logger.debug(`Cleanup: failed to ${what}`, { bucketName, error });
        }
    };
    const createdObjects = world.getCreatedObjects();
    if (createdObjects !== undefined) {
        const { versions, deleteMarkers } = await listAllObjectVersions(world, bucketName);
        await Promise.all([...versions, ...deleteMarkers].map(obj => bestEffort('delete an object',
            world.s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: obj.Key, VersionId: obj.VersionId })))));
    }
    await bestEffort('delete the replication', world.s3.send(new DeleteBucketReplicationCommand({
        Bucket: bucketName,
    })));
    await bestEffort('delete the lifecycle', world.s3.send(new DeleteBucketLifecycleCommand({ Bucket: bucketName })));
    await bestEffort('delete the bucket', world.s3.send(new DeleteBucketCommand({ Bucket: bucketName })));
}

async function addMultipleObjects(this: Zenko, numberObjects: number,
    objectName: string, sizeBytes: number, userMD?: string, parts?: number) {
    let lastResult = null;
    for (let i = 1; i <= numberObjects; i++) {
        const objectNameFinal = getObjectNameWithBackendFlakiness.call(this, `${objectName}-${i}`) ||
            randomString();
        if (sizeBytes > 0) {
            this.addToSaved('objectSize', sizeBytes);
        }
        if (userMD) {
            this.addToSaved('userMetadata', userMD);
        }
        lastResult = parts === undefined
            ? await putObject(this, objectNameFinal)
            : await putMpuObject(this, parts, objectNameFinal);
    }
    return lastResult;
}

async function addUserMetadataToObject(this: Zenko, objectName: string | undefined, userMD: string) {
    const objName = objectName || this.getSaved<string>('objectName');
    const bucketName = this.getSaved<string>('bucketName');
    return settle(this.s3.send(new CopyObjectCommand({
        Bucket: bucketName,
        Key: objName,
        CopySource: `${bucketName}/${objName}`,
        Metadata: parseMetadata(userMD),
        MetadataDirective: 'REPLACE',
    })));
}

async function getTopicsOffsets(topics: string[], kafkaAdmin: Admin) {
    const offsets = [];
    for (const topic of topics) {
        const metadata = await kafkaAdmin.metadata({ topics: [topic] });
        const partitionCount = metadata.topics.get(topic)?.partitionsCount ?? 0;
        const partitionIndexes = Array.from({ length: partitionCount }, (_, i) => ({
            partitionIndex: i,
            timestamp: BigInt(-2),
        }));
        const earliestResult = await kafkaAdmin.listOffsets({
            topics: [{ name: topic, partitions: partitionIndexes }],
        });
        const latestResult = await kafkaAdmin.listOffsets({
            topics: [{ name: topic, partitions: partitionIndexes.map(p => ({ ...p, timestamp: BigInt(-1) })) }],
        });
        const partitions = [];
        for (let i = 0; i < partitionCount; i++) {
            const low = earliestResult[0]?.partitions.find(p => p.partitionIndex === i)?.offset ?? BigInt(0);
            const high = latestResult[0]?.partitions.find(p => p.partitionIndex === i)?.offset ?? BigInt(0);
            partitions.push({ low: String(low), high: String(high) });
        }
        offsets.push({ topic, partitions });
    }
    return offsets;
}

Given('{int} additional accounts', async function (this: Zenko, count: number) {
    for (let i = 0; i < count; i++) {
        await this.createAccount();
    }
});

async function createBucket(world: Zenko, versioning: string, bucketName: string) {
    world.addToSaved('bucketName', bucketName);
    await world.s3.send(new CreateBucketCommand({ Bucket: bucketName }));
    world.addToSaved('bucketVersioning', versioning);
    if (versioning !== 'Non versioned') {
        await world.s3.send(new PutBucketVersioningCommand({
            Bucket: bucketName,
            VersioningConfiguration: { Status: versioning === 'Versioned' ? 'Enabled' : 'Suspended' },
        }));
    }
}

Given('a {string} bucket with dot', async function (this: Zenko, versioning: string) {
    const preName = this.getSaved<string>('accountName') ||
        this.parameters.AccountName || constants.ACCOUNT_NAME;
    await createBucket(this, versioning,
        `${preName}.${constants.BUCKET_NAME_TEST}${randomString()}`.toLocaleLowerCase());
});

Given('a {string} bucket', async function (this: Zenko, versioning: string) {
    const preName = this.getSaved<string>('accountName') ||
        this.parameters.AccountName || constants.ACCOUNT_NAME;
    await createBucket(this, versioning,
        `${preName}${constants.BUCKET_NAME_TEST}${randomString()}`.toLocaleLowerCase());
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
        const result = await addMultipleObjects.call(this, numberObjects, objectName, sizeBytes);
        assert.ifError(result?.error);
    });

Given('{int} mpu objects {string} of size {int} bytes',
    async function (this: Zenko, numberObjects: number, objectName: string, sizeBytes: number) {
        const result = await addMultipleObjects.call(this, numberObjects, objectName, sizeBytes, undefined, 1);
        assert.ifError(result?.error);
    });

Given('{string} is copied to {string}',
    async function (this: Zenko, sourceObject: string, destinationObject: string) {
        const result = await copyObject(this, sourceObject, destinationObject);
        assert.ifError(result?.error);
    });

Given('{int} objects {string} of size {int} bytes on {string} site',
    async function (this: Zenko, numberObjects: number, objectName: string, sizeBytes: number, site: string) {
        if (site === 'DR') {
            Identity.useIdentity(IdentityEnum.ACCOUNT, `${Zenko.sites['source'].accountName}-replicated`);
        } else {
            Identity.useIdentity(IdentityEnum.ACCOUNT, Zenko.sites['source'].accountName);
        }
        const result = await addMultipleObjects.call(this, numberObjects, objectName, sizeBytes);
        assert.ifError(result?.error);
    });

Given('{int} objects {string} of size {int} bytes with user metadata {string}',
    async function (this: Zenko, numberObjects: number, objectName: string, sizeBytes: number, userMD: string) {
        const result = await addMultipleObjects.call(this, numberObjects, objectName, sizeBytes, userMD);
        assert.ifError(result?.error);
    });

Given('a tag on object {string} with key {string} and value {string}',
    async function (this: Zenko, objectName: string, tagKey: string, tagValue: string) {
        await this.s3.send(new PutObjectTaggingCommand({
            Bucket: this.getSaved<string>('bucketName'),
            Key: objectName,
            VersionId: this.getLatestObjectVersion(objectName) || undefined,
            Tagging: { TagSet: [{ Key: tagKey, Value: tagValue }] },
        }));
    });

Given('SSL is {string} for S3 API calls', function (this: Zenko, ssl: string) {
    this.useHttps(ssl === 'enabled');
    this.logger.debug(`SSL is ${ssl}`);
});

Then('object {string} should have the tag {string} with value {string}',
    async function (this: Zenko, objectName: string, tagKey: string, tagValue: string) {
        const { TagSet } = await this.s3.send(new GetObjectTaggingCommand({
            Bucket: this.getSaved<string>('bucketName'),
            Key: objectName,
            VersionId: this.getLatestObjectVersion(objectName) || undefined,
        }));
        assert(TagSet?.some(tag => tag.Key === tagKey && tag.Value === tagValue));
    });

Then('object {string} should have the user metadata with key {string} and value {string}',
    async function (this: Zenko, objectName: string, userMDKey: string, userMDValue: string) {
        const { Metadata } = await this.s3.send(new HeadObjectCommand({
            Bucket: this.getSaved<string>('bucketName'),
            Key: objectName,
            VersionId: this.getLatestObjectVersion(objectName) || undefined,
        }));
        assert(Metadata);
        assert(Metadata[userMDKey]);
        assert(Metadata[userMDKey] === userMDValue);
    });

// add a transition workflow to a bucket
Given('a transition workflow to {string} location', async function (this: Zenko, location: string) {
    await addTransitionWorkflow.call(this, location);
});

Given('a replication configuration to {string} location',
    async function (this: Zenko, replicationLocation: string) {
        this.addToSaved('replicationLocations', [replicationLocation]);
        await putBucketReplication.call(this, this.getSaved<string>('bucketName'), replicationLocation);
    });

Given('a {string} replication configuration to {string} location',
    async function (this: Zenko, format: 'V1' | 'V2', replicationLocation: string) {
        assert(format === 'V1' || format === 'V2', `unsupported rule format '${format}', expected 'V1' or 'V2'`);
        this.addToSaved('replicationLocations', [replicationLocation]);
        await putBucketReplication.call(this, this.getSaved<string>('bucketName'), replicationLocation, format);
    });

When('i restore object {string} for {int} days', async function (this: Zenko, objectName: string, days: number) {
    await restoreObject.call(this, objectName, days);
});

// wait for object to transition to a location or get restored from it
Then('object {string} should be {string} and have the storage class {string}',
    { timeout: 130000 }, verifyObjectLocation);

When('i delete object {string}', async function (this: Zenko, objectName: string) {
    const objName = getObjectNameWithBackendFlakiness.call(this, objectName) || this.getSaved<string>('objectName');
    await this.s3.send(new DeleteObjectCommand({
        Bucket: this.getSaved<string>('bucketName'),
        Key: objName,
        VersionId: this.getLatestObjectVersion(objName) || undefined,
    }));
});

Then('i {string} be able to add user metadata to object {string}',
    async function (this: Zenko, expectedResult: string, objectName: string) {
        const res = await addUserMetadataToObject.call(this, objectName, 'x-amz-meta-test=test');
        if (expectedResult === 'should not') {
            assert(failedWith(res, 'InvalidObjectState'));
        } else {
            assert.ifError(res.error);
        }
    });

Then('kafka consumed messages should not take too much place on disk', { timeout: -1 },
    async function (this: Zenko) {
        const kfkcIntervalSeconds = parseGoDuration(this.parameters.KafkaCleanerInterval);
        const checkInterval = kfkcIntervalSeconds * 1000;
        const deadline = Date.now() + checkInterval * 3;

        const kafkaAdmin = new Admin({
            clientId: 'ctst-kafka-cleaner-check',
            bootstrapBrokers: [this.parameters.KafkaHosts],
        });

        try {
            const excludedTopics = ['dead-letter', 'backbeat-metrics'];
            const prefix = `${this.parameters.InstanceID}.`;
            const allTopics = await kafkaAdmin.listTopics();
            const topics: string[] = allTopics
                .filter(t => t.startsWith(prefix) &&
                    !excludedTopics.some(excluded => t.includes(excluded)));

            const previousOffsets = new Map<string, { low: string, high: string }[]>();
            for (const { topic, partitions } of await getTopicsOffsets(topics, kafkaAdmin)) {
                previousOffsets.set(topic, partitions);
            }

            let remainingTopics = topics;

            while (true) {
                assert(Date.now() < deadline,
                    'Kafka cleaner did not clean topics within the expected time. ' +
                    `Remaining: ${remainingTopics.join(', ')}`);

                const newOffsets = await getTopicsOffsets(remainingTopics, kafkaAdmin);
                const nextTopics: string[] = [];

                for (let i = 0; i < remainingTopics.length; i++) {
                    const topic = remainingTopics[i];
                    const previousTopicOffsets = previousOffsets.get(topic)!;
                    this.logger.debug('Checking topic', { topic });
                    let topicCleaned = false;
                    for (let j = 0; j < newOffsets[i].partitions.length; j++) {
                        const newOffsetPartition = newOffsets[i].partitions[j];
                        const oldOffsetPartition = previousTopicOffsets[j];

                        if (!oldOffsetPartition) {
                            continue;
                        }

                        const lowOffsetIncreased = parseInt(newOffsetPartition.low) >
                            parseInt(oldOffsetPartition.low);
                        // We tolerate one message not being cleaned, as it can be due to the
                        // message being consumed during the check
                        const allMessagesCleaned = parseInt(newOffsetPartition.low) + 1 >=
                            parseInt(newOffsetPartition.high);

                        if (lowOffsetIncreased || allMessagesCleaned) {
                            topicCleaned = true;
                        } else {
                            this.logger.debug(`Partition ${j} of topic ${topic} not cleaned as expected`, {
                                previousOffsets: oldOffsetPartition,
                                newOffsets: newOffsetPartition,
                            });
                        }
                    }
                    if (!topicCleaned) {
                        nextTopics.push(topic);
                    }
                }

                if (nextTopics.length === 0) {
                    break;
                }
                remainingTopics = nextTopics;
                await sleep(5000);
            }
        } finally {
            await kafkaAdmin.close();
        }
    });

Then('kafka cleaner has successfully deleted some topic messages', async function (this: Zenko) {
    const prometheusQuery = encodeURIComponent(
        'sum(kafka_cleaner_kafka_requests{type="DeleteRecords",status="success"})'
    );
    const metricsResponse = await fetch(
        `${this.parameters.PrometheusEndpoint}/api/v1/query?query=${prometheusQuery}`
    );
    assert(metricsResponse.ok,
        `Prometheus query failed with status ${metricsResponse.status}: ${metricsResponse.statusText}`);
    const metricsData = await metricsResponse.json() as {
        status: string;
        data: { result: { value: [number, string] }[] };
    };
    assert.strictEqual(metricsData.status, 'success',
        `Prometheus returned non-success status: ${metricsData.status}`);
    const deleteRecordsCount = metricsData.data.result.length > 0
        ? parseFloat(metricsData.data.result[0].value[1])
        : 0;
    this.logger.info('Kafka cleaner DeleteRecords count', { deleteRecordsCount });
    assert(deleteRecordsCount > 0,
        'Kafka cleaner has not successfully called DeleteRecords since it started');
});

Given('an object {string} that {string}', async function (this: Zenko, objectName: string, objectExists: string) {
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
                this.addToSaved('objectName', `objectrepeat-${randomString()}`);
            } else if (action.action === 'CopyObject') {
                this.addToSaved('copyObject', `objectrepeatcopy-${randomString()}`);
            }
            await runActionAgainstBucket(this, this.getSaved<ActionPermissionsType>('currentAction').action);
            const { error } = this.getResult();
            if (error && error.$retryable?.throttling !== true) {
                this.logger.debug('Error during repeated action', { error });
                break;
            }
            await sleep(delay);
        }
    });

Then('the API should {string} with {string}', function (this: Zenko, result: string, expected: string) {
    const action = this.getSaved<ActionPermissionsType>('currentAction');
    switch (result) {
    case 'succeed':
        if (action.expectedResultOnAllowTest) {
            assert.strictEqual(succeededOrFailedWith(this.getResult(), action.expectedResultOnAllowTest), true);
        } else {
            assert.ifError(this.getResult().error);
        }
        break;
    case 'fail':
        assert.strictEqual(failedWith(this.getResult(), expected), true);
        break;
    default:
        throw new Error('The API should have a correct expected result defined');
    }
});

Then('the http response code is {int}', function (this: Zenko, expectedStatus: number) {
    const response = this.getSaved<{ statusCode: number }>('lastHttpResponse');
    assert.strictEqual(response.statusCode, expectedStatus,
        `Expected status ${expectedStatus} but got ${response.statusCode}`);
});

Then('the operation finished without error', function (this: Zenko) {
    this.useSavedIdentity();
    assert.ifError(this.getResult().error);
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
    await addMultipleObjects.call(this, 1, `object-${randomString()}`, size);
});
