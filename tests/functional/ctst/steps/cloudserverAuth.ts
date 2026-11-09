import { When, Then } from '@cucumber/cucumber';
import {
    CreateBucketCommand,
    DeleteObjectsCommand,
    DeleteObjectsCommandOutput,
    PutObjectRetentionCommand,
} from '@aws-sdk/client-s3';
import Zenko from '../world/Zenko';
import { randomString } from 'common/utils';
import constants from 'common/constants';
import { settle } from 'common/result';
import { strict as assert } from 'assert';

When('the user tries to perform DeleteObjects', async function (this: Zenko) {
    this.useSavedIdentity();
    const objects = [...this.getCreatedObjects()].map(([key]) => ({ Key: key }));
    this.setResult(await settle(this.s3.send(new DeleteObjectsCommand({
        Bucket: this.getSaved<string>('bucketName'),
        Delete: { Objects: objects },
    }))));
});

When('the user tries to perform CreateBucket', async function (this: Zenko) {
    this.useSavedIdentity();
    const preName = this.getSaved<string>('accountName') ||
        this.parameters.AccountName || constants.ACCOUNT_NAME;
    const usedBucketName = `${preName}${constants.BUCKET_NAME_TEST}${randomString()}`.toLocaleLowerCase();
    this.addToSaved('bucketName', usedBucketName);
    this.setResult(await settle(this.s3.send(new CreateBucketCommand({
        Bucket: usedBucketName,
        ObjectLockEnabledForBucket: true,
    }))));
});

When('the user tries to perform PutObjectRetention {string} bypass', async function (this: Zenko, withBypass: string) {
    this.useSavedIdentity();
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    this.setResult(await settle(this.s3.send(new PutObjectRetentionCommand({
        Bucket: this.getSaved<string>('bucketName'),
        Key: this.getSaved<string>('objectName'),
        Retention: { Mode: 'COMPLIANCE', RetainUntilDate: date },
        BypassGovernanceRetention: withBypass === 'with' || undefined,
    }))));
});

Then('it {string} pass Vault authentication', function (this: Zenko, should: string) {
    // DeleteObjects reports the failures of each object in its response
    const { data, error } = this.getResult<Partial<DeleteObjectsCommandOutput>>();
    if (should === 'should') {
        assert.ifError(error);
        if (data?.Errors?.length) {
            throw new Error('Expected no error but got errors');
        }
    } else if (!error && !data?.Errors?.length) {
        throw new Error('Expected error but got none');
    }
});
