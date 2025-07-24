import {Given, Then} from '@cucumber/cucumber';
import Zenko from 'world/Zenko';
import {S3, Utils} from 'cli-testing';
import {ListObjectsV2Output, ListObjectVersionsOutput, PutObjectOutput} from '@aws-sdk/client-s3';
import {safeJsonParse} from 'common/utils';
import assert from 'assert';
import {saveAsFile} from './utils/utils';

Given('{int} threads each uploading {int} versions of object {string} of size {int} bytes', async function (
    this: Zenko,
    numberOfThread: number,
    numberOfVerionPerThread: number,
    objectName: string,
    sizeBytes: number,
) {
    const bucketName = this.getSaved<string>('bucketName');
    this.addToSaved('objectName', objectName);
    let processedCounter = numberOfVerionPerThread * numberOfThread;

    await Promise.all(Array.from({length: numberOfThread}, async () => {
        for (let i = 0; i < numberOfVerionPerThread; i++) {
            const tempFileName = `${Utils.randomString()}_${objectName}`;
            const objectBody = 'a'.repeat(sizeBytes);
            await saveAsFile(tempFileName, objectBody);

            const result = await S3.putObject({
                bucket: bucketName,
                key: objectName,
                body: tempFileName,
            });
            const res = safeJsonParse<PutObjectOutput>(result.stdout);

            if (!res.ok) {
                processedCounter--;
                this.logger.debug(`Failed to put object ${objectName} in bucket ${bucketName}: ${res.error}`);
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
    const results = await S3.listObjectsV2({
        bucket: bucketName,
        maxItems: '1000',
        prefix: objectName,
    });
    const res = safeJsonParse<ListObjectsV2Output>(results.stdout);
    assert.ok(res.ok, `Failed to list objects in bucket ${bucketName}: ${res.error}`);
    assert.equal(
        res.result?.Contents?.length,
        1,
        `Expected 1 object with prefix ${objectName} in bucket ${bucketName}, found ${res.result?.Contents?.length}`
    );

    const object = res.result!.Contents![0];
    assert.ok(object.Key, `Object in bucket ${bucketName} has no Key: ${JSON.stringify(object)}`);

    const versions = await S3.listObjectVersions({
        bucket: bucketName,
        prefix: object.Key,
        maxItems: '1000',
    });
    const versionsRes = safeJsonParse<ListObjectVersionsOutput>(versions.stdout);
    assert.ok(versionsRes.ok, `Failed to list versions in bucket ${bucketName}: ${versionsRes.error}`);
    assert.ok(versionsRes.result?.Versions, `No versions found in bucket ${bucketName} for object ${object.Key}`);
    assert.equal(
        versionsRes.result.Versions.length,
        objectCreatedCounter,
        `Expected ${objectCreatedCounter} versions for object, found ${versionsRes.result.Versions.length}`
    );
});
