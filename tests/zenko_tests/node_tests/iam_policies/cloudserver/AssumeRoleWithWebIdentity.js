const assert = require('assert');
const async = require('async');
const { errors } = require('arsenal');
const {
    CreateBucketCommand,
    PutObjectCommand,
    DeleteObjectCommand,
    DeleteBucketCommand,
} = require('@aws-sdk/client-s3');
const { GetRoleCommand } = require('@aws-sdk/client-iam');
const { AssumeRoleWithWebIdentityCommand } = require('@aws-sdk/client-sts');
const VaultClient = require('../../VaultClient');
const { getS3Client } = require('../../s3SDK');
const { getSTSClient } = require('../../stsSDK');
const { getTokenForIdentity } = require('../../utils/getWebIdentityToken');
const {
    metadataSearchResponseCode,
    restoreObjectResponseCode,
    putObjectResponseCode,
    putObjectAclResponseCode,
    putObjectVersionAclResponseCode,
    getObjectResponseCode,
    getObjectVersionResponseCode,
    getObjectAclResponseCode,
    getObjectVersionAclResponseCode,
    deleteObjectResponseCode,
    deleteObjectVersionResponseCode,
    getBucketVersioningResponseCode,
    getBucketCorsResponseCode,
    getBucketAclResponseCode,
    getBucketObjectLockConfResponseCode,
    getBucketObjectRetentionResponseCode,
    getBucketObjectVersionRetentionResponseCode,
    getReplicationConfigurationResponseCode,
    getLifecycleConfigurationResponseCode,
    putLifecycleConfigurationResponseCode,
    putReplicationConfigurationResponseCode,
    getObjectLegalHoldResponseCode,
    getObjectVersionLegalHoldResponseCode,
    getObjectTaggingResponseCode,
    getObjectVersionTaggingResponseCode,
    listObjectsV2ResponseCode,
    listObjectVersionsResponseCode,
    copyObjectResponseCode,
    putObjectRetentionResponseCode,
    putObjectVersionRetentionResponseCode,
    putObjectTaggingResponseCode,
    putObjectLegalHoldTaggingResponseCode,
    putObjectVersionLegalHoldTaggingResponseCode,
    deleteObjectVersionTaggingResponseCode,
    putObjectVersionTaggingResponseCode,
    putObjectLockConfigurationResponseCode,
    deleteObjectsResponseCode,
    headObjectResponseCode,
    getBucketTaggingResponseCode,
    putBucketTaggingResponseCode,
    deleteBucketTaggingResponseCode,
} = require('./utils');

let iamClient = null;
let stsClient = null;
let s3Client = null;

const clientAdmin = VaultClient.getAdminClient();
const accountName = 'AccountTest';
const accountInfo = {
    email: `${accountName}@test.com`,
    password: 'test',
};
const externalAccessKey = 'DZMMJUPWIUK8IWXRP0HQ';
const externalSecretKey = 'iTuJdlidzrLipymvAGrLP66Yxghl4NQxLZR3cLlu';

const duration = 1000;

const storageManagerName = 'storage_manager';
const storageAccountOwnerName = 'storage_account_owner';
const dataConsumerName = 'data_consumer';
const storageManagerRole = 'storage-manager-role';
const storageAccountOwnerRole = 'storage-account-owner-role';
const dataConsumerRole = 'data-consumer-role';

const testAPIs = [
    {
        API: 'MetadataSearch',
        checkResponse: metadataSearchResponseCode,
    },
    {
        API: 'RestoreObject',
        checkResponse: restoreObjectResponseCode,
    },
    {
        API: 'PutObject',
        checkResponse: putObjectResponseCode,
    },
    {
        API: 'PutObjectAcl',
        checkResponse: putObjectAclResponseCode,
    },
    {
        API: 'GetObject',
        checkResponse: getObjectResponseCode,
    },
    {
        API: 'GetObjectAcl',
        checkResponse: getObjectAclResponseCode,
    },
    {
        API: 'DeleteObject',
        checkResponse: deleteObjectResponseCode,
    },
    {
        API: 'GetBucketVersioning',
        checkResponse: getBucketVersioningResponseCode,
    },
    {
        API: 'GetBucketCors',
        checkResponse: getBucketCorsResponseCode,
    },
    {
        API: 'GetBucketAcl',
        checkResponse: getBucketAclResponseCode,
    },
    {
        API: 'GetBucketObjectLockConfiguration',
        checkResponse: getBucketObjectLockConfResponseCode,
    },
    {
        API: 'ListObjectsV2',
        checkResponse: listObjectsV2ResponseCode,
    },
    {
        API: 'ListObjectVersions',
        checkResponse: listObjectVersionsResponseCode,
    },
    {
        API: 'PutObjectLockConfiguration',
        checkResponse: putObjectLockConfigurationResponseCode,
    },
    {
        API: 'DeleteObjects',
        checkResponse: deleteObjectsResponseCode,
    },
    {
        API: 'GetObjectRetention',
        checkResponse: getBucketObjectRetentionResponseCode,
    },
    {
        API: 'GetObjectLegalHold',
        checkResponse: getObjectLegalHoldResponseCode,
    },
    {
        API: 'PutObjectRetention',
        checkResponse: putObjectRetentionResponseCode,
    },
    {
        API: 'PutObjectLegalHold',
        checkResponse: putObjectLegalHoldTaggingResponseCode,
    },
    {
        API: 'HeadObject',
        checkResponse: headObjectResponseCode,
    },
    {
        API: 'CopyObject',
        checkResponse: copyObjectResponseCode,
    },
    {
        API: 'GetObjectTagging',
        checkResponse: getObjectTaggingResponseCode,
    },
    {
        API: 'PutObjectTagging',
        checkResponse: putObjectTaggingResponseCode,
    },
    {
        API: 'DeleteObjectVersion',
        checkResponse: deleteObjectVersionResponseCode,
    },
    {
        API: 'GetBucketReplication',
        checkResponse: getReplicationConfigurationResponseCode,
    },
    {
        API: 'GetBucketLifecycle',
        checkResponse: getLifecycleConfigurationResponseCode,
    },
    {
        API: 'PutBucketLifecycle',
        checkResponse: putLifecycleConfigurationResponseCode,
    },
    {
        API: 'PutBucketReplication',
        checkResponse: putReplicationConfigurationResponseCode,
    },
    {
        API: 'GetObjectVersion',
        checkResponse: getObjectVersionResponseCode,
    },
    {
        API: 'GetObjectVersionRetention',
        checkResponse: getBucketObjectVersionRetentionResponseCode,
    },
    {
        API: 'PutObjectVersionRetention',
        checkResponse: putObjectVersionRetentionResponseCode,
    },
    {
        API: 'GetObjectVersionLegalHold',
        checkResponse: getObjectVersionLegalHoldResponseCode,
    },
    {
        API: 'PutObjectVersionLegalHold',
        checkResponse: putObjectVersionLegalHoldTaggingResponseCode,
    },
    {
        API: 'GetObjectVersionTagging',
        checkResponse: getObjectVersionTaggingResponseCode,
    },
    {
        API: 'DeleteObjectVersionTagging',
        checkResponse: deleteObjectVersionTaggingResponseCode,
    },
    {
        API: 'PutObjectVersionTagging',
        checkResponse: putObjectVersionTaggingResponseCode,
    },
    {
        API: 'GetObjectVersionAcl',
        checkResponse: getObjectVersionAclResponseCode,
    },
    {
        API: 'PutObjectVersionAcl',
        checkResponse: putObjectVersionAclResponseCode,
    },
    {
        API: 'GetBucketTagging',
        checkResponse: getBucketTaggingResponseCode,
    },
    {
        API: 'PutBucketTagging',
        checkResponse: putBucketTaggingResponseCode,
    },
    {
        API: 'DeleteBucketTagging',
        checkResponse: deleteBucketTaggingResponseCode,
    },
];

testAPIs.forEach(testAPI => {
    const bucket1 = `bucket1-${testAPI.API.toLowerCase()}`;

    describe(`iam policies - cloudserver - AssumeRoleWithWebIdentity - ${testAPI.API}`, () => {
        before(done => {
            async.series([
                // create an account, generateAccountAccessKey for it
                // get iam client, sts client and s3 client of this account
                next => clientAdmin.createAccount(accountName, accountInfo, next),
                next => clientAdmin.generateAccountAccessKey(
                    accountName,
                    next,
                    { externalAccessKey, externalSecretKey },
                ),
                next => {
                    iamClient = VaultClient.getIamClient(externalAccessKey, externalSecretKey);
                    stsClient = getSTSClient(externalAccessKey, externalSecretKey);
                    s3Client = getS3Client(externalAccessKey, externalSecretKey);
                    next();
                },
                // use s3 client to create a bucket and put 2 objects
                next => {
                    async.series([
                        next => {
                            s3Client.send(new CreateBucketCommand({ Bucket: bucket1 }))
                                .then(() => next(), next);
                        },
                        next => {
                            s3Client.send(new PutObjectCommand({ Bucket: bucket1, Key: 'file1' }))
                                .then(() => next(), next);
                        },
                    ], next);
                },
            ], done);
        });

        after(async () => {
            await s3Client.send(new DeleteObjectCommand({
                Bucket: bucket1,
                Key: 'file1',
            }));
            await s3Client.send(new DeleteBucketCommand({ Bucket: bucket1 }));
            await VaultClient.deleteVaultAccount(clientAdmin, iamClient, accountName);
        });

        const tests = [
            {
                name: `should be able to perform ${testAPI.API} on all buckets for storage manager role`,
                oidcIdentity: storageManagerName,
                roleName: storageManagerRole,
                assertion: result => assert.notStrictEqual(result.code, errors.AccessDenied.message),
            },
            {
                name: `should be able to perform ${testAPI.API} on all buckets for storage account owner role`,
                oidcIdentity: storageAccountOwnerName,
                roleName: storageAccountOwnerRole,
                assertion: result => assert.notStrictEqual(result.code, errors.AccessDenied.message),
            },
            {
                name: `should be able to perform ${testAPI.API} on all buckets for data consumer role`,
                oidcIdentity: dataConsumerName,
                roleName: dataConsumerRole,
                assertion: result => assert.notStrictEqual(result.code, errors.AccessDenied.message),
            },
        ];

        tests.forEach((test, i) => {
            it(test.name, async () => {
                const jwtToken = await new Promise((resolve, reject) => {
                    getTokenForIdentity(test.oidcIdentity, (err, token) => (err ? reject(err) : resolve(token)));
                });

                const roleRes = await iamClient.send(new GetRoleCommand({ RoleName: test.roleName }));
                const roleArn = roleRes.Role.Arn;
                const assumeRoleRes = await stsClient.send(new AssumeRoleWithWebIdentityCommand({
                    RoleArn: roleArn,
                    DurationSeconds: duration,
                    WebIdentityToken: jwtToken,
                    RoleSessionName: `session-name-test-${i}-${testAPI.API.toLowerCase()}`,
                }));
                const sessionUserCredentials = {
                    accessKeyId: assumeRoleRes.Credentials.AccessKeyId,
                    secretAccessKey: assumeRoleRes.Credentials.SecretAccessKey,
                    sessionToken: assumeRoleRes.Credentials.SessionToken,
                };

                const result = await new Promise((resolve, reject) => {
                    testAPI.checkResponse(
                        sessionUserCredentials,
                        bucket1,
                        (err, result) => (err ? reject(err) : resolve(result)),
                        'file1',
                    );
                });

                test.assertion(result);
            });
        });
    });
});

