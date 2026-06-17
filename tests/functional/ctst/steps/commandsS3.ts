import { Given, When } from '@cucumber/cucumber';
import Zenko from 'world/Zenko';
import { Utils, Constants } from 'cli-testing';
import {
    copyObject,
    restoreObject,
    addTransitionWorkflow,
    putBucketReplication,
} from 'steps/utils/utils';
import {
    CreateBucketCommand,
    DeleteObjectsCommand,
    PutObjectRetentionCommand,
    ObjectLockRetentionMode,
    PutBucketEncryptionCommand,
    GetBucketEncryptionCommand,
    DeleteBucketEncryptionCommand,
    PutBucketWebsiteCommand,
    PutBucketPolicyCommand,
    type ServerSideEncryption,
} from '@aws-sdk/client-s3';

When('the user tries to perform DeleteObjects', async function (this: Zenko) {
    this.useSavedIdentity();
    const bucket = this.getSaved<string>('bucketName');
    const objects = this.getCreatedObjects();
    try {
        this.saveS3Result(await this.awsClients.s3.send(new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: [...objects.keys()].map(key => ({ Key: key })) },
        })));
    } catch (err) {
        this.saveS3Error(err);
    }
});

When('the user tries to perform CreateBucket', async function (this: Zenko) {
    this.useSavedIdentity();
    const preName = this.getSaved<string>('accountName') ||
        this.parameters.AccountName || Constants.ACCOUNT_NAME;
    const usedBucketName = `${preName}${Constants.BUCKET_NAME_TEST}${Utils.randomString()}`.toLocaleLowerCase();
    this.addToSaved('bucketName', usedBucketName);
    try {
        this.saveS3Result(await this.awsClients.s3.send(new CreateBucketCommand({
            Bucket: usedBucketName,
            ObjectLockEnabledForBucket: true,
        })));
    } catch (err) {
        this.saveS3Error(err);
    }
});

When('the user tries to perform PutObjectRetention {string} bypass', async function (this: Zenko, withBypass: string) {
    this.useSavedIdentity();
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    try {
        this.saveS3Result(await this.awsClients.s3.send(new PutObjectRetentionCommand({
            Bucket: this.getSaved<string>('bucketName'),
            Key: this.getSaved<string>('objectName'),
            Retention: { Mode: ObjectLockRetentionMode.COMPLIANCE, RetainUntilDate: date },
            BypassGovernanceRetention: withBypass === 'with',
        })));
    } catch (err) {
        this.saveS3Error(err);
    }
});

When('bucket encryption is set to {string} with key {string}',
    async function (this: Zenko, algo: string, keyId: string) {
        if (!algo) {
            return;
        }
        try {
            this.saveS3Result(await this.awsClients.s3.send(new PutBucketEncryptionCommand({
                Bucket: this.getSaved<string>('bucketName'),
                ServerSideEncryptionConfiguration: {
                    Rules: [{
                        ApplyServerSideEncryptionByDefault: {
                            SSEAlgorithm: algo as ServerSideEncryption,
                            ...(keyId ? { KMSMasterKeyID: keyId } : {}),
                        },
                    }],
                },
            })));
        } catch (err) {
            this.saveS3Error(err);
        }
    },
);

When('the user gets bucket encryption', async function (this: Zenko) {
    try {
        this.saveS3Result(await this.awsClients.s3.send(
            new GetBucketEncryptionCommand({ Bucket: this.getSaved<string>('bucketName') }),
        ));
    } catch (err) {
        this.saveS3Error(err);
    }
});

When('the user deletes bucket encryption', async function (this: Zenko) {
    try {
        this.saveS3Result(await this.awsClients.s3.send(
            new DeleteBucketEncryptionCommand({ Bucket: this.getSaved<string>('bucketName') }),
        ));
    } catch (err) {
        this.saveS3Error(err);
    }
});

When('the user puts the bucket website configuration', async function (this: Zenko) {
    await this.awsClients.s3.send(new PutBucketWebsiteCommand({
        Bucket: this.getSaved<string>('bucketName'),
        WebsiteConfiguration: {
            IndexDocument: { Suffix: 'index.html' },
            ErrorDocument: { Key: 'error.html' },
        },
    }));
});

When('the user creates an S3 Bucket policy granting public read access', async function (this: Zenko) {
    const bucketName = this.getSaved<string>('bucketName');
    await this.awsClients.s3.send(new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [{
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucketName}/*`],
            }],
        }),
    }));
});

Given('{string} is copied to {string}',
    async function (this: Zenko, sourceObject: string, destinationObject: string) {
        await copyObject(this, sourceObject, destinationObject);
    });

Given('a transition workflow to {string} location', async function (this: Zenko, location: string) {
    await addTransitionWorkflow.call(this, location);
});

Given('a replication configuration to {string} location',
    async function (this: Zenko, replicationLocation: string) {
        this.addToSaved('replicationLocation', replicationLocation);
        await putBucketReplication.call(this, this.getSaved<string>('bucketName'), replicationLocation);
    });

When('i restore object {string} for {int} days', async function (this: Zenko, objectName: string, days: number) {
    await restoreObject.call(this, objectName, days);
});
