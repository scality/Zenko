import { Given, setDefaultTimeout } from '@cucumber/cucumber';
import { Constants, S3, Utils } from 'cli-testing';
import { extractPropertyFromResults } from './utils';

setDefaultTimeout(Constants.DEFAULT_TIMEOUT);

Given('a {string} bucket', async function (versioning) {
    this.resetCommand();
    const preName = this.parameters.AccountName || Constants.ACCOUNT_NAME;
    const bucketName = `${preName}${Constants.BUCKET_NAME_TEST}${Utils.randomString()}`.toLocaleLowerCase();
    this.saved.bucketName = bucketName;
    this.addCommandParameter({ bucket: bucketName });
    await S3.createBucket(this.getCommandParameters());
    this.saved.bucketVersioning = versioning;
    if (versioning !== 'Non versioned') {
        const versioningConfiguration = versioning === 'Versioned' ? 'Enabled' : 'Suspended';
        this.addCommandParameter({ versioningConfiguration: `Status=${versioningConfiguration}` });
        await S3.putBucketVersioning(this.getCommandParameters());
    }
});

Given('an existing bucket {string} {string} versioning, {string} ObjectLock {string} retention mode', async function
    (bucketName, withVersioning, withObjectLock, retentionMode) {
    this.resetCommand();
    const preName = this.parameters.AccountName || Constants.ACCOUNT_NAME;
    bucketName = bucketName || `${preName}${Constants.BUCKET_NAME_TEST}${Utils.randomString()}`.toLocaleLowerCase();
    this.saved.bucketName = bucketName;
    this.addCommandParameter({ bucket: bucketName });
    await S3.createBucket(this.getCommandParameters());
    if (withVersioning === 'with') {
        this.addCommandParameter({ versioningConfiguration: `Status=Enabled` });
        await S3.putBucketVersioning(this.getCommandParameters());
    }
    if (withObjectLock === 'with') {
        this.resetCommand();
        this.addCommandParameter({ bucket: bucketName });
        this.addCommandParameter({ 
            objectLockConfiguration: '{ ' +
            '"ObjectLockEnabled": "Enabled",' +
            '"Rule": {' +
            '"DefaultRetention":' +
            `{ "Mode": "${retentionMode}", "Days": 50 }}}`
        });
        await S3.putObjectLockConfiguration(this.getCommandParameters());
    }
});

Given('an object {string} that {string}',
    async function (objectName, objectExists) {
        this.resetCommand();
        if (objectExists === 'exists') {
            this.saved.objectName = objectName || 'x'.repeat(10);
            this.addCommandParameter({ key: this.saved.objectName });
            this.addCommandParameter({ bucket: this.saved.bucketName });
            this.saved.versionId = extractPropertyFromResults(
                await S3.putObject(this.getCommandParameters()), 'VersionId'
            );
        }
    });
