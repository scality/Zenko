import { Given, setDefaultTimeout } from '@cucumber/cucumber';
import { Constants, S3, Utils } from 'cli-testing';
import Zenko from 'world/Zenko';
import { extractPropertyFromResults } from './utils';
import { createBucketWithConfiguration, putObject } from 'steps/utils/utils';

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
    await createBucketWithConfiguration(this, bucketName, withVersioning, withObjectLock, retentionMode);
});

Given('an object {string} that {string}',
    async function (this: Zenko, objectName: string, objectExists: string) {
        this.resetCommand();
        if (objectExists === 'exists') {
            await putObject(this, objectName);
        }
    });
