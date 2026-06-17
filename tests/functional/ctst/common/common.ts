import {
    DeleteObjectCommand,
    ListObjectVersionsCommand,
    DeleteBucketCommand,
    DeleteBucketLifecycleCommand,
    CreateBucketCommand,
    PutBucketVersioningCommand,
    CopyObjectCommand,
    PutObjectTaggingCommand,
    GetObjectTaggingCommand,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Given, setDefaultTimeout, Then, When } from '@cucumber/cucumber';
import { CacheHelper, Constants, Utils } from 'cli-testing';
import Zenko from 'world/Zenko';
import { parseGoDuration } from './utils';
import assert from 'assert';
import { Admin } from '@platformatic/kafka';
import {
    createBucketWithConfiguration,
    putMpuObject,
    putObject,
    runActionAgainstBucket,
    getObjectNameWithBackendFlakiness,
    verifyObjectLocation,
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
    const accountName = world.getSaved<string>('accountName') || world.parameters.AccountName;
    world.awsClients.useIdentity(accountName);
    const createdObjects = world.getCreatedObjects();
    if (createdObjects !== undefined) {
        const listResult = await world.awsClients.s3.send(new ListObjectVersionsCommand({ Bucket: bucketName }));
        const versions = listResult.Versions || [];
        const deleteMarkers = listResult.DeleteMarkers || [];
        await Promise.all([...versions, ...deleteMarkers].map(obj =>
            world.awsClients.s3.send(new DeleteObjectCommand({
                Bucket: bucketName,
                Key: obj.Key!,
                VersionId: obj.VersionId,
                BypassGovernanceRetention: true,
            })),
        ));
    }
    try {
        await world.awsClients.s3.send(new DeleteBucketLifecycleCommand({ Bucket: bucketName }));
    } catch { /* ignore */ }
    try {
        await world.awsClients.s3.send(new DeleteBucketCommand({ Bucket: bucketName }));
    } catch { /* ignore */ }
}

async function addMultipleObjects(this: Zenko, numberObjects: number,
    objectName: string, sizeBytes: number, userMD?: string, parts?: number) {
    for (let i = 1; i <= numberObjects; i++) {
        this.resetCommand();
        const objectNameFinal = getObjectNameWithBackendFlakiness.call(this, `${objectName}-${i}`) ||
            Utils.randomString();
        if (sizeBytes > 0) {
            this.addToSaved('objectSize', sizeBytes);
        }
        if (userMD) {
            const metadataRecord: Record<string, string> = {};
            userMD.split(',').forEach(pair => {
                const eqIdx = pair.indexOf('=');
                if (eqIdx !== -1) {
                    let key = pair.slice(0, eqIdx).trim();
                    if (key.startsWith('x-amz-meta-')) key = key.slice('x-amz-meta-'.length);
                    metadataRecord[key] = pair.slice(eqIdx + 1).trim();
                }
            });
            this.addToSaved('userMetadata', metadataRecord);
        }
        if (parts === undefined) {
            await putObject(this, objectNameFinal);
        } else {
            await putMpuObject(this, parts, objectNameFinal);
        }
    }
}

async function addUserMetadataToObject(this: Zenko, objectName: string | undefined, userMD: string) {
    const objName = objectName || this.getSaved<string>('objectName');
    const bucketName = this.getSaved<string>('bucketName');
    const eqIdx = userMD.indexOf('=');
    const metadata: Record<string, string> = {};
    if (eqIdx !== -1) {
        const rawKey = userMD.slice(0, eqIdx);
        const key = rawKey.startsWith('x-amz-meta-') ? rawKey.slice('x-amz-meta-'.length) : rawKey;
        metadata[key] = userMD.slice(eqIdx + 1);
    }
    try {
        await this.awsClients.s3.send(new CopyObjectCommand({
            Bucket: bucketName,
            Key: objName,
            CopySource: `${bucketName}/${objName}`,
            Metadata: metadata,
            MetadataDirective: 'REPLACE',
        }));
        return { err: null };
    } catch (err) {
        const error = err as { name?: string; message?: string };
        return { err: error.name || error.message || 'UnknownError' };
    }
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
    await world.awsClients.s3.send(new CreateBucketCommand({ Bucket: bucketName }));
    world.addToSaved('bucketVersioning', versioning);
    if (versioning !== 'Non versioned') {
        const status = versioning === 'Versioned' ? 'Enabled' : 'Suspended';
        await world.awsClients.s3.send(new PutBucketVersioningCommand({
            Bucket: bucketName,
            VersioningConfiguration: { Status: status },
        }));
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

Given('{int} mpu objects {string} of size {int} bytes',
    async function (this: Zenko, numberObjects: number, objectName: string, sizeBytes: number) {
        await addMultipleObjects.call(this, numberObjects, objectName, sizeBytes, undefined, 1);
    });

Given('{int} objects {string} of size {int} bytes on {string} site',
    async function (this: Zenko, numberObjects: number, objectName: string, sizeBytes: number, site: string) {
        const identityName = site === 'DR'
            ? `${Zenko.sites['source'].accountName}-replicated`
            : Zenko.sites['source'].accountName;
        this.awsClients.useIdentity(identityName);
        await addMultipleObjects.call(this, numberObjects, objectName, sizeBytes);
    });

Given('{int} objects {string} of size {int} bytes with user metadata {string}',
    async function (this: Zenko, numberObjects: number, objectName: string, sizeBytes: number, userMD: string) {
        await addMultipleObjects.call(this, numberObjects, objectName, sizeBytes, userMD);
    });

Given('a tag on object {string} with key {string} and value {string}',
    async function (this: Zenko, objectName: string, tagKey: string, tagValue: string) {
        const versionId = this.getLatestObjectVersion(objectName);
        await this.awsClients.s3.send(new PutObjectTaggingCommand({
            Bucket: this.getSaved<string>('bucketName'),
            Key: objectName,
            VersionId: versionId || undefined,
            Tagging: { TagSet: [{ Key: tagKey, Value: tagValue }] },
        }));
    });

Given('SSL is {string} for S3 API calls', function (this: Zenko, ssl: string) {
    if (ssl === 'enabled') {
        CacheHelper.parameters.ssl = true;
        CacheHelper.parameters.port = '443';
        this.logger.debug('SSL is enabled');
    } else {
        CacheHelper.parameters.ssl = false;
        CacheHelper.parameters.port = '80';
        this.logger.debug('SSL is disabled');
    }
});

Then('object {string} should have the tag {string} with value {string}',
    async function (this: Zenko, objectName: string, tagKey: string, tagValue: string) {
        const versionId = this.getLatestObjectVersion(objectName);
        const res = await this.awsClients.s3.send(new GetObjectTaggingCommand({
            Bucket: this.getSaved<string>('bucketName'),
            Key: objectName,
            VersionId: versionId || undefined,
        }));
        assert(res.TagSet?.some(tag => tag.Key === tagKey && tag.Value === tagValue));
    });

Then('object {string} should have the user metadata with key {string} and value {string}',
    async function (this: Zenko, objectName: string, userMDKey: string, userMDValue: string) {
        const versionId = this.getLatestObjectVersion(objectName);
        const res = await this.awsClients.s3.send(new HeadObjectCommand({
            Bucket: this.getSaved<string>('bucketName'),
            Key: objectName,
            VersionId: versionId || undefined,
        }));
        assert(res.Metadata, 'Expected metadata to be present');
        const shortKey = userMDKey.startsWith('x-amz-meta-') ? userMDKey.slice('x-amz-meta-'.length) : userMDKey;
        assert.strictEqual(res.Metadata[shortKey], userMDValue);
    });

// wait for object to transition to a location or get restored from it
Then('object {string} should be {string} and have the storage class {string}',
    { timeout: 130000 }, verifyObjectLocation);

When('i delete object {string}', async function (this: Zenko, objectName: string) {
    const objName = getObjectNameWithBackendFlakiness.call(this, objectName) || this.getSaved<string>('objectName');
    const versionId = this.getLatestObjectVersion(objName);
    await this.awsClients.s3.send(new DeleteObjectCommand({
        Bucket: this.getSaved<string>('bucketName'),
        Key: objName,
        VersionId: versionId || undefined,
    }));
});

Then('i {string} be able to add user metadata to object {string}',
    async function (this: Zenko, expectedResult: string, objectName: string) {
        const res = await addUserMetadataToObject.call(this, objectName, 'x-amz-meta-test=test');
        if (expectedResult === 'should not') {
            assert(res.err?.includes('InvalidObjectState'));
        } else {
            assert.strictEqual(res.err, null);
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
                await Utils.sleep(5000);
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
            const repeatOutcome = this.getS3Outcome();
            if (!repeatOutcome.ok) {
                const isThrottling = repeatOutcome.error.name.includes('Throttling') ||
                    repeatOutcome.error.name.includes('SlowDown');
                if (!isThrottling) {
                    this.logger.debug('Error during repeated action', { error: repeatOutcome.error.name });
                    break;
                }
            }
            await Utils.sleep(delay);
        }
    });

Then('the API should {string} with {string}', function (this: Zenko, result: string, expected: string) {
    const action = this.getSaved<ActionPermissionsType>('currentAction');
    const outcome = this.getS3Outcome();
    switch (result) {
    case 'succeed':
        if (action.expectedResultOnAllowTest) {
            assert.ok(
                outcome.ok || (!outcome.ok && outcome.error.name.includes(action.expectedResultOnAllowTest)),
                `Expected success or "${action.expectedResultOnAllowTest}" but got: ${outcome.ok ? 'success' : outcome.error.name}`,
            );
        } else {
            assert.ok(outcome.ok, `Expected success but got: ${!outcome.ok ? outcome.error.message : ''}`);
        }
        break;
    case 'fail':
        assert.ok(!outcome.ok && outcome.error.name.includes(expected),
            `Expected error "${expected}" but got: ${outcome.ok ? 'success' : outcome.error.name}`);
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
    const outcome = this.getS3Outcome();
    assert.ok(outcome.ok, `Expected success but got: ${!outcome.ok ? outcome.error.message : ''}`);
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
    await addMultipleObjects.call(this, 1, `object-${Utils.randomString()}`, size);
});
