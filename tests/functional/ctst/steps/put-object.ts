import {Given, Then} from '@cucumber/cucumber';
import Zenko from 'world/Zenko';
import {ListObjectsV2Command, PutObjectCommand} from '@aws-sdk/client-s3';
import assert from 'assert';
import {settle} from 'common/result';
import {listAllObjectVersions} from './utils/utils';

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
    const body = 'a'.repeat(sizeBytes);

    await Promise.all(Array.from({ length: numberOfThread }, async () => {
        for (let i = 0; i < numberOfVerionPerThread; i++) {
            const { error } = await settle(this.s3.send(new PutObjectCommand({
                Bucket: bucketName,
                Key: objectName,
                Body: body,
            })));
            if (error) {
                processedCounter--;
                this.logger.debug(`Failed to put object ${objectName} in bucket ${bucketName}: ${error}`);
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
    const { Contents } = await this.s3.send(new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: objectName,
    }));
    assert.equal(
        Contents?.length,
        1,
        `Expected 1 object with prefix ${objectName} in bucket ${bucketName}, found ${Contents?.length}`
    );

    const object = Contents![0];
    assert.ok(object.Key, `Object in bucket ${bucketName} has no Key: ${JSON.stringify(object)}`);

    const { versions } = await listAllObjectVersions(this, bucketName, object.Key);
    assert.ok(versions.length, `No versions found in bucket ${bucketName} for object ${object.Key}`);
    assert.equal(
        versions.length,
        objectCreatedCounter,
        `Expected ${objectCreatedCounter} versions for object, found ${versions.length}`
    );
});
