import { Given, setDefaultTimeout } from '@cucumber/cucumber';
import { Constants, S3, Utils } from 'cli-testing';

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
        this.addCommandParameter({ versioningConfiguration: `Status=${versioningConfiguration}`});
        await S3.putBucketVersioning(this.getCommandParameters());
    }
});

Given('an existing bucket {string} {string} versioning', async function (bucketName, hasVersioning) {
    this.resetCommand();
    const preName = this.parameters.AccountName || Constants.ACCOUNT_NAME;
    if (bucketName === '') {
        bucketName = `${preName}${Constants.BUCKET_NAME_TEST}${Utils.randomString()}`.toLocaleLowerCase();
    }
    this.saved.bucketName = bucketName;
    this.addCommandParameter({ bucket: bucketName });
    await S3.createBucket(this.getCommandParameters());
    if (hasVersioning === 'with') {
        this.addCommandParameter({ versioningConfiguration: `Status=Enabled`});
        await S3.putBucketVersioning(this.getCommandParameters());
    }
});

Given('we {string} an existing object {string} {string} version-Id {string}',
    async function (have, objectName, hasVersioning, versionId) {
    this.resetCommand();
    if (have === 'have') {
        if (objectName === '') {
            objectName = 'x'.repeat(10);
        }
        this.saved.objectName = objectName;
        this.saved.versionId = versionId;
        this.addCommandParameter({key: objectName});
        this.addCommandParameter({bucket: this.saved.bucketName});
        if (hasVersioning === 'with') {
            this.addCommandParameter({versionId});
        }
        await S3.putObject(this.getCommandParameters());
    }
});