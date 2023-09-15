import { When, Then } from '@cucumber/cucumber';
import Zenko from '../world/Zenko';
import { Utils, S3, Constants } from 'cli-testing';
import { strict as assert } from 'assert';

interface DeleteObjectsResult {
    Deleted?: {
        Key: string;
        DeleteMarker?: boolean;
        DeleteMarkerVersionId?: string;
    }[];
    Errors?: {
        Key: string;
        VersionId?: string;
        Code: string;
        Message: string;
    }[];
}

When('the user tries to perform DeleteObjects', async function (this: Zenko) {
    this.resetCommand();
    this.resumeRootOrIamUser();
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    let keys = '';
    const objectNames = this.getSaved<string[]>('objectNameArray');
    objectNames.forEach((objectName, i) => {
        let key = `{Key=${objectName}}`;
        if (i < objectNames.length - 1) {
            key += ',';
        }
        keys += key;
    });
    this.addCommandParameter({ delete: `Objects=[${keys}]` });
    this.setResult(await S3.deleteObjects(this.getCommandParameters()));
});

When('the user tries to perform CreateBucket', async function (this: Zenko) {
    this.resetCommand();
    this.resumeRootOrIamUser();
    const preName = (this.parameters.AccountName || Constants.ACCOUNT_NAME);
    const usedBucketName = `${preName}${Constants.BUCKET_NAME_TEST}${Utils.randomString()}`.toLocaleLowerCase();
    this.addToSaved('bucketName', usedBucketName);
    this.addCommandParameter({ bucket: usedBucketName });
    // Empty strings are used to pass parameters that are used as a flag and do not require a value
    this.addCommandParameter({ objectLockEnabledForBucket: ' ' });
    this.setResult(await S3.createBucket(this.getCommandParameters()));
});

When('the user tries to perform PutObjectRetention {string} bypass', async function (this: Zenko, withBypass: string) {
    this.resetCommand();
    this.resumeRootOrIamUser();
    this.addCommandParameter({ key: this.getSaved<string>('objectName') });
    this.addCommandParameter({ bucket: this.getSaved<string>('bucketName') });
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    // Get the string representation in the desired format
    const dateString = date.toISOString();
    this.addCommandParameter({ retention: `Mode=COMPLIANCE,RetainUntilDate=${dateString}` });
    if (withBypass === 'with') {
        this.addCommandParameter({ bypassGovernanceRetention: ' ' });
    }
    this.setResult(await S3.putObjectRetention(this.getCommandParameters()));
});

Then('it {string} pass Vault authentication', function (this: Zenko, should: string) {
    this.cleanupEntity();

    let stdout;
    if (should === 'should') {
        assert.strictEqual(this.getResult().err, null);
        if (this.getResult().stdout) {
            stdout = JSON.parse(this.getResult().stdout!) as DeleteObjectsResult;
            if (stdout.Errors) {
                throw new Error('Expected no error but got errors');
            }
        }
    } else {
        if (this.getResult().stdout) {
            stdout = JSON.parse(this.getResult().stdout!) as DeleteObjectsResult;
            if (!stdout.Errors) {
                throw new Error('Expected error but got none');
            }
        } else {
            assert.notStrictEqual(this.getResult().err, null);
        }
    }
});

