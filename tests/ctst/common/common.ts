import fs from 'fs';
import { tmpNameSync } from 'tmp';
import { Given, setDefaultTimeout, Then, When } from '@cucumber/cucumber';
import { Constants, KafkaHelper, S3, Utils } from 'cli-testing';
import Zenko from 'world/Zenko';
import { extractPropertyFromResults, safeJsonParse } from './utils';
import assert from 'assert';
import { Kafka } from 'kafkajs';

setDefaultTimeout(Constants.DEFAULT_TIMEOUT);

async function addMultipleObjects(this: Zenko, numberObjects: number,
    objectName: string, sizeBytes: number, userMD?: string) {
    for (let i = 1; i <= numberObjects; i++) {
        this.addToSaved('objectName', `${objectName}-${i}` || Utils.randomString());
        const objectPath = tmpNameSync({prefix: this.getSaved<string>('objectName')});
        fs.writeFileSync(objectPath, Buffer.alloc(sizeBytes, this.getSaved<string>('objectName')));
        this.resetCommand();
        this.addCommandParameter({ key: this.getSaved<string>('objectName') });
        this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
        this.addCommandParameter({ body: objectPath });
        if (userMD) {
            this.addCommandParameter({ metadata: JSON.stringify(userMD) });
        }
        this.addToSaved('versionId', extractPropertyFromResults(
            await S3.putObject(this.getCommandParameters()), 'VersionId')
        );
        fs.rmSync(objectPath);
        const createdObjects = this.getSaved<Map<string, string>>('createdObjects') || new Map<string, string>();
        createdObjects.set(this.getSaved<string>('objectName'), this.getSaved<string>('versionId'));
        this.addToSaved('createdObjects', createdObjects);
    }
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
(this: Zenko, bucketName: string, withVersioning: string, withObjectLock: string, retentionMode: string) {
    this.resetCommand();
    const preName = (this.parameters.AccountName || Constants.ACCOUNT_NAME);
    const usedBucketName = bucketName
        || `${preName}${Constants.BUCKET_NAME_TEST}${Utils.randomString()}`.toLocaleLowerCase();
    this.addToSaved('bucketName', usedBucketName);
    this.addCommandParameter({ bucket: usedBucketName });
    if (withObjectLock === 'with') {
        // Empty strings are used to pass parameters that are used as a flag and do not require a value
        this.addCommandParameter({ objectLockEnabledForBucket: ' ' });
    }
    await S3.createBucket(this.getCommandParameters());
    if (withVersioning === 'with') {
        this.addCommandParameter({ versioningConfiguration: 'Status=Enabled' });
        await S3.putBucketVersioning(this.getCommandParameters());
    }
    if (retentionMode === 'GOVERNANCE' || retentionMode === 'COMPLIANCE') {
        this.resetCommand();
        this.addCommandParameter({ bucket: usedBucketName });
        this.addCommandParameter({
            objectLockConfiguration: '{ ' +
                '"ObjectLockEnabled": "Enabled",' +
                '"Rule": {' +
                '"DefaultRetention":' +
                `{ "Mode": "${retentionMode}", "Days": 50 }}}`,
        });
        await S3.putObjectLockConfiguration(this.getCommandParameters());
    }
});

Given('an object {string} that {string}',
    async function (this: Zenko, objectName: string, objectExists: string) {
        this.resetCommand();
        if (objectExists === 'exists') {
            this.addToSaved('objectName', objectName || Utils.randomString());
            let objectNameArray = this.getSaved<string[]>('objectNameArray') || [];
            objectNameArray.push(this.getSaved<string>('objectName'));
            this.addToSaved('objectNameArray', objectNameArray);
            this.addCommandParameter({ key: this.getSaved<string>('objectName') });
            this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
            this.addToSaved('versionId', extractPropertyFromResults(
                await S3.putObject(this.getCommandParameters()), 'VersionId'
            ));
        }
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
        this.addCommandParameter({ tagging: `"TagSet=[{Key='${tagKey}',Value='${tagValue}'}]"` });
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
    this.resetCommand();
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    this.addCommandParameter({
        lifecycleConfiguration: JSON.stringify({
            Rules: [
                {
                    Status: 'Enabled',
                    Prefix: '',
                    Transitions: [
                        {
                            Days: 1,
                            StorageClass: location,
                        },
                    ],
                },
            ],
        }),
    });
    await S3.putBucketLifecycleConfiguration(this.getCommandParameters());
});

When('i restore object {string} for {int} days', async function (this: Zenko, objectName: string, days: number) {
    const objName = objectName ||  this.getSaved<string>('objectName');
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
Then('object {string} should be {string} and have the storage class {string}',
    async function (this: Zenko, objectName: string, operation: string, storageClass: string) {
        const objName = objectName ||  this.getSaved<string>('objectName');
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
            if (operation == 'restored') {
                const isRestored = !!head?.Restore &&
                    head.Restore.includes('ongoing-request="false", expiry-date=');
                // if restore didn't get initiated fail immediately
                const isPendingRestore = !!head?.Restore &&
                    head.Restore.includes('ongoing-request="true"');
                assert(isRestored || isPendingRestore, 'Restore didn\'t get initiated');
                conditionOk = conditionOk && isRestored;
            }
            await Utils.sleep(3000);
        }
        assert(conditionOk);
    });

Then('kafka consumed messages should not take too much place on disk',
    async function (this: Zenko) {
        await Utils.sleep(30000); // Sleep to let kafka cleaner do his job (every 30s)
        const kafkaAdmin = new Kafka({ brokers: [this.parameters.KafkaHosts] }).admin();
        const topics: string[] = (await kafkaAdmin.listTopics()).filter(topic => topic.includes(this.parameters.InstanceID));
        const notToCheckTopics = ['oplog', 'dead-letter'];
        for (const topic of topics) {
            if (notToCheckTopics.some(notToCheckTopic => topic.includes(notToCheckTopic))) {
                continue;
            }
            process.stdout.write(`Checking topic ${topic} offsets\n`);
            const topicOffsets = await kafkaAdmin.fetchTopicOffsets(topic);
            for (const partition of topicOffsets) {
                if (topic.includes('bucket-tasks')) {
                    const diff = partition.high - partition.low;
                    // This offset constantly increases due to ongoing processes,
                    // we want to check that the cleaner worked by verifying that the difference between high and low offsets is not too high
                    assert(diff < (0.1 * partition.high));
                }
                assert.strictEqual(partition.high, partition.low);
            }
        }
    });

When('i delete object {string}', async function (this: Zenko, objectName: string) {
    const objName = objectName ||  this.getSaved<string>('objectName');
    this.resetCommand();
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    this.addCommandParameter({ key: objName });
    const versionId = this.getSaved<Map<string, string>>('createdObjects')?.get(objName);
    if (versionId) {
        this.addCommandParameter({ versionId });
    }
    await S3.deleteObject(this.getCommandParameters());
});
