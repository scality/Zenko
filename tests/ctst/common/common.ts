import { Given, setDefaultTimeout, Then, When } from '@cucumber/cucumber';
import { Constants, S3, Utils } from 'cli-testing';
import Zenko from 'world/Zenko';
import assert from 'assert';
import { Admin, Kafka } from 'kafkajs';
import { createBucketWithConfiguration, putObject, runActionAgainstBucket } from 'steps/utils/utils';
import { ActionPermissionsType } from 'steps/bucket-policies/utils';

setDefaultTimeout(Constants.DEFAULT_TIMEOUT);

async function getTopicsOffsets(topics: string[], kafkaAdmin: Admin) {
    const offsets = [];
    for (const topic of topics) {
        const partitions: ({ high: string; low: string; })[] =
            await kafkaAdmin.fetchTopicOffsets(topic);
        offsets.push({ topic, partitions });
    }
    return offsets;
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
        this.parameters.logger?.debug('Unknown backend flakyness', { backendFlakiness });
        return objectName;
    }
    return objectNameFinal;
}

async function addMultipleObjects(this: Zenko, numberObjects: number,
    objectName: string, sizeBytes: number, userMD?: string) {
    let lastResult = null;
    for (let i = 1; i <= numberObjects; i++) {
        const objectNameFinal = getObjectNameWithBackendFlakiness.call(this, `${objectName}-${i}`) ||
            Utils.randomString();
        if (sizeBytes > 0) {
            this.addToSaved('objectSize', sizeBytes);
        }
        if (userMD) {
            this.addCommandParameter({ metadata: JSON.stringify(userMD) });
        }
        this.addToSaved('objectName', objectNameFinal);
        this.resetCommand();
        this.parameters.logger?.debug('Adding object', { objectName: objectNameFinal });
        lastResult = await putObject(this, objectNameFinal);
        const createdObjects = this.getSaved<Map<string, string>>('createdObjects') || new Map<string, string>();
        createdObjects.set(this.getSaved<string>('objectName'), this.getSaved<string>('versionId'));
        this.addToSaved('createdObjects', createdObjects);
    }
    return lastResult;
}

Given('an account', async function (this: Zenko) {
    await this.createAccount();
});

Given('a {string} bucket', async function (this: Zenko, versioning: string) {
    this.resetCommand();
    const preName = this.getSaved<string>('accountName') ||
        this.parameters.AccountName || Constants.ACCOUNT_NAME;
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

Then('kafka consumed messages should not take too much place on disk', { timeout: -1 },
    async function (this: Zenko) {
        const kfkcIntervalSeconds = parseInt(this.parameters.KafkaCleanerInterval);
        const checkInterval = kfkcIntervalSeconds * (1000 + 3000);

        const timeoutID = setTimeout(() => {
            assert.fail('Kafka cleaner did not clean the topics');
        }, checkInterval * 5); // Timeout after 5 kafkacleaner intervals

        try {
            const ignoredTopics = ['dead-letter'];
            const kafkaAdmin = new Kafka({ brokers: [this.parameters.KafkaHosts] }).admin();
            const topics: string[] = (await kafkaAdmin.listTopics())
                .filter(t => (t.includes(this.parameters.InstanceID) &&
                !ignoredTopics.some(e => t.includes(e))));

            while (topics.length > 0) {
                const previousOffsets = await getTopicsOffsets(topics, kafkaAdmin);
                // Checking topics offsets before kafkacleaner passes to be sure kafkacleaner works
                // This function can be improved by consuming messages and
                // verify that the timestamp is not older than last kafkacleaner run
                // Instead of waiting for a fixed amount of time,
                // we could also check for metrics to see last kafkacleaner run

                // 3 seconds added to be sure kafkacleaner had time to process
                await Utils.sleep(checkInterval);

                const newOffsets = await getTopicsOffsets(topics, kafkaAdmin);

                for (let i = 0; i < topics.length; i++) {
                    process.stdout.write(`\nChecking topic ${topics[i]}\n`);
                    for (let j = 0; j < newOffsets[i].partitions.length; j++) {
                        const newMessagesAfterClean =
                            newOffsets[i].partitions[j].low === previousOffsets[i].partitions[j].high &&
                            newOffsets[i].partitions[j].high > previousOffsets[i].partitions[j].high;

                        if (newMessagesAfterClean) {
                            // If new messages appeared after we gathered the offsets, we need to recheck after
                            process.stdout.write(`New messages after clean for topic ${topics[i]} rechecking after`);
                            continue;
                        }

                        const lowOffsetIncreased = newOffsets[i].partitions[j].low >
                            previousOffsets[i].partitions[j].low;
                        const allMessagesCleaned = newOffsets[i].partitions[j].high ===
                            newOffsets[i].partitions[j].low;

                        // If the low offset increased it means the topic has been cleaned
                        // If low offset is the same as high offset,
                        // it means the topic is completly cleaned even though lowOffset didnt increased
                        assert.ok(lowOffsetIncreased || allMessagesCleaned,
                            `Topic ${topics[i]} partition ${j} offset has not increased,
                            previousOffsets: ${previousOffsets[i].partitions[j].low} /\
                            ${previousOffsets[i].partitions[j].high},
                            newOffsets: ${newOffsets[i].partitions[j].low} / ${newOffsets[i].partitions[j].high}`);

                        // Topic is cleaned, we don't need to check it anymore
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
        this.setAuthMode('test_identity');
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
    this.cleanupEntity();
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
    this.cleanupEntity();
    assert.strictEqual(!!this.getResult().err, false);
});

Given('an upload size of {int} B for the object {string}', async function (
    this: Zenko,
    size: number,
    objectName: string
) {
    this.addToSaved('objectSize', size);
    if (this.getSaved<boolean>('preExistingObject')) {
        if (objectName) {
            this.addToSaved('objectName', objectName);
        } else {
            this.addToSaved('objectName', `object-${Utils.randomString()}`);
        }
        await putObject(this, this.getSaved<string>('objectName'));
    }
});

When('I PUT an object with size {int}', async function (this: Zenko, size: number) {
    if (size > 0) {
        this.addToSaved('objectSize', size);
    }
    this.addToSaved('objectName', `object-${Utils.randomString()}`);
    const result = await addMultipleObjects.call(
        this, 1, this.getSaved<string>('objectName'), size);
    this.setResult(result!);
});

When('i delete object {string}', async function (this: Zenko, objectName: string) {
    const objName = objectName || this.getSaved<string>('objectName');
    this.resetCommand();
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    this.addCommandParameter({ key: objName });
    const versionId = this.getSaved<Map<string, string>>('createdObjects')?.get(objName);
    if (versionId) {
        this.addCommandParameter({ versionId });
    }
    await S3.deleteObject(this.getCommandParameters());
});
