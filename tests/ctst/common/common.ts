import { Given, setDefaultTimeout, Then } from '@cucumber/cucumber';
import { Constants, S3, Utils } from 'cli-testing';
import Zenko from 'world/Zenko';
import { extractPropertyFromResults } from './utils';
import assert from 'assert';
import { Kafka } from 'kafkajs';

setDefaultTimeout(Constants.DEFAULT_TIMEOUT);

async function getTopicsOffsets(topics:string[], kafkaAdmin:any) {
    const offsets = [];
    for (const topic of topics) {
        const partitions = await kafkaAdmin.fetchTopicOffsets(topic);
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
        const notToCheckTopics = ['oplog', 'dead-letter'];
        const kafkaAdmin = new Kafka({ brokers: [this.parameters.KafkaHosts] }).admin();
        const topics: string[] = (await kafkaAdmin.listTopics()).filter(t => (t.includes(this.parameters.InstanceID) && !notToCheckTopics.includes(t)));
        const previousOffsets = await getTopicsOffsets(topics, kafkaAdmin);

        await Utils.sleep(35000);

        const newOffsets = await getTopicsOffsets(topics, kafkaAdmin);

        for (let i = 0; i < topics.length; i++) {
            process.stdout.write(`\nChecking topic ${topics[i]}\n`);
            for (let j = 0; j < newOffsets[i].partitions.length; j++) {
                // Checking that the min offset has increased due to kafkacleaner
                // or that it didn't need to change because there was no new messages
                assert(newOffsets[i].partitions[j].low > previousOffsets[i].partitions[j].low ||
                    newOffsets[i].partitions[j].high === newOffsets[i].partitions[j].low);
            }
        }
    });
