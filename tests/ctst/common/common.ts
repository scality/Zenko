import { Given } from '@cucumber/cucumber';
import { Constants, S3, Utils } from 'cli-testing';

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
        this.addCommandParameter({ versioningConfiguration: `Status=${versioningConfiguration}`});
        await S3.putBucketVersioning(this.getCommandParameters());
    }
});

Given('an existing bucket and an Object', async function () {
    const preName = this.parameters.AccountName || Constants.ACCOUNT_NAME;
    const bucketName = `${preName}${Constants.BUCKET_NAME_TEST}${Utils.randomString()}`.toLocaleLowerCase();
    this.saved.bucketName = bucketName;
    this.addCommandParameter({ bucket: bucketName });
    await S3.createBucket(this.getCommandParameters());
    this.addCommandParameter({ key: 'x'.repeat(10) });
    await S3.putObject(this.getCommandParameters());
});
