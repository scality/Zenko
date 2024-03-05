import { Given, setDefaultTimeout, Then } from '@cucumber/cucumber';
import { Constants, S3, Utils } from 'cli-testing';
import Zenko from 'world/Zenko';
import { extractPropertyFromResults } from './utils';
import assert from 'assert';
import { Admin, Kafka } from 'kafkajs';

setDefaultTimeout(Constants.DEFAULT_TIMEOUT);

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
        const ignoredTopics = ['dead-letter'];
        const kafkaAdmin = new Kafka({ brokers: [this.parameters.KafkaHosts] }).admin();

        const kafka = new Kafka({ brokers: [this.parameters.KafkaHosts] });

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
                const test = newOffsets[i].partitions[j].low > previousOffsets[i].partitions[j].low ||
                newOffsets[i].partitions[j].high === newOffsets[i].partitions[j].low;

                if (!test) {
                assert.ok(newOffsets[i].partitions[j].low > previousOffsets[i].partitions[j].low ||
                    newOffsets[i].partitions[j].high === newOffsets[i].partitions[j].low,
                `Topic ${topics[i]} partition ${j} offset has not increased,
                previousOffsets: ${previousOffsets[i].partitions[j].low} / ${previousOffsets[i].partitions[j].high},
                newOffsets: ${newOffsets[i].partitions[j].low} / ${newOffsets[i].partitions[j].high}`);
            }
        }
    });
