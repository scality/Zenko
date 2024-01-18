import { Given, setDefaultTimeout, Then } from '@cucumber/cucumber';
import { Constants, S3, Utils } from 'cli-testing';
import Zenko from 'world/Zenko';
import { extractPropertyFromResults } from './utils';
import assert from 'assert';
import { Kafka } from 'kafkajs';

setDefaultTimeout(Constants.DEFAULT_TIMEOUT);

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

Then('kafka consumed messages should not take too much place on disk',
    async function (this: Zenko) {
        await Utils.sleep(30000); // Sleep to let kafka cleaner do his job (every 30s)
        const kafkaAdmin = new Kafka({ brokers: [this.parameters.KafkaHosts] }).admin();
        const topics: string[] = (await kafkaAdmin.listTopics()).filter(t => t.includes(this.parameters.InstanceID));
        const notToCheckTopics = ['oplog', 'dead-letter'];
        for (const topic of topics) {
            if (notToCheckTopics.some(notToCheckTopic => topic.includes(notToCheckTopic))) {
                continue;
            }
            process.stdout.write(`Checking topic ${topic} offsets\n`);
            const topicOffsets = await kafkaAdmin.fetchTopicOffsets(topic);
            for (const partition of topicOffsets) {
                if (topic.includes('bucket-tasks')) {
                    const diff = parseInt(partition.high) - parseInt(partition.low);
                    // This offset constantly increases due to ongoing processes,
                    // we want to check that the cleaner worked by verifying that
                    // the difference between high and low offsets is not too high
                    assert(diff < (0.1 * parseInt(partition.high)));
                } else {
                    assert.strictEqual(partition.high, partition.low);
                }
            }
        }
    });
