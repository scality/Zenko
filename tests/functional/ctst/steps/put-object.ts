import {Given, Then} from '@cucumber/cucumber';
import Zenko from 'world/Zenko';
import {
    PutObjectCommand,
    ListObjectsV2Command,
    ListObjectVersionsCommand,
} from '@aws-sdk/client-s3';
import assert from 'assert';

Given('{int} threads each uploading {int} versions of object {string} of size {int} bytes', async function (
    this: Zenko,
    numberOfThread: number,
    numberOfVerionPerThread: number,
    objectName: string,
    sizeBytes: number,
) {
    let processedCounter = numberOfVerionPerThread * numberOfThread;
    const bucketName = this.getSaved<string>('bucketName');
    this.addToSaved('objectName', objectName);
    this.addToSaved('objectSize', sizeBytes);

    await Promise.all(Array.from({ length: numberOfThread }, async () => {
        for (let i = 0; i < numberOfVerionPerThread; i++) {
            try {
                await this.awsClients.s3.send(new PutObjectCommand({
                    Bucket: bucketName,
                    Key: objectName,
                    Body: Buffer.from(bucketName),
                }));
            } catch (err) {
                processedCounter--;
                this.logger.debug(`Failed to put object ${objectName} in bucket ${bucketName}: ${(err as Error).message}`);
            }
        }
    }));

    this.addToSaved('objectCreatedCounter', processedCounter);
});

Then('{int} versions of objects {string} should exist', async function (
    this: Zenko,
    expectedNumberOfVersions: number,
    objectName: string
) {
    const objectCreatedCounter = this.getSaved<number>('objectCreatedCounter');

    if (objectCreatedCounter !== expectedNumberOfVersions) {
        this.logger.debug(
            `${expectedNumberOfVersions} versions of object expected, only ${objectCreatedCounter} created.`
        );
    }

    const bucketName = this.getSaved<string>('bucketName');
    const listResult = await this.awsClients.s3.send(new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1000,
        Prefix: objectName,
    }));
    assert.equal(
        listResult.Contents?.length,
        1,
        `Expected 1 object with prefix ${objectName} in bucket ${bucketName}, found ${listResult.Contents?.length}`
    );

    const object = listResult.Contents![0];
    assert.ok(object.Key, `Object in bucket ${bucketName} has no Key: ${JSON.stringify(object)}`);

    const versionsResult = await this.awsClients.s3.send(new ListObjectVersionsCommand({
        Bucket: bucketName,
        Prefix: object.Key,
        MaxKeys: 1000,
    }));
    assert.ok(versionsResult.Versions, `No versions found in bucket ${bucketName} for object ${object.Key}`);
    assert.equal(
        versionsResult.Versions.length,
        objectCreatedCounter,
        `Expected ${objectCreatedCounter} versions for object, found ${versionsResult.Versions.length}`
    );
});
