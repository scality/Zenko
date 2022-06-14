const assert = require('assert');
const async = require('async');
const { errors } = require('arsenal');
const VaultClient = require('../../VaultClient');
const { getS3Client } = require('../../s3SDK');
const { getSTSClient } = require('../../stsSDK');
const { getTokenForIdentity } = require('../../utils/getWebIdentityToken');
const {
    metadataSearchResponseCode,
    restoreObjectResponseCode,
    putObjectResponseCode,
    putObjectAclResponseCode,
    getObjectResponseCode,
    getObjectAclResponseCode,
    deleteObjectVersionResponseCode,
    deleteObjectResponseCode,
    getBucketVersioningResponseCode,
    getBucketCorsResponseCode,
    getBucketAclResponseCode,
    getBucketObjectLockConfResponseCode,
    getReplicationConfigurationResponseCode,
    getLifecycleConfigurationResponseCode,
    putLifecycleConfigurationResponseCode,
    putReplicationConfigurationResponseCode,
    getBucketObjectRetentionResponseCode,
    getObjectLegalHoldResponseCode,
    getObjectTaggingResponseCode,
    listObjectsV2ResponseCode,
    listObjectVersionsResponseCode,
    copyObjectResponseCode,
    putObjectRetentionResponseCode,
    putObjectTaggingResponseCode,
    putObjectLegalHoldTaggingResponseCode,
    putObjectLockConfigurationResponseCode,
    deleteObjectsResponseCode,
    headObjectResponseCode,
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

const duration = '1000';

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
                        next => s3Client.createBucket({ Bucket: bucket1 }, next),
                        next => s3Client.putObject({ Bucket: bucket1, Key: 'file1' }, next),
                    ], next);
                },
            ], done);
        });

        after(done => {
            async.series([
                next => s3Client.deleteObject({
                    Bucket: bucket1,
                    Key: 'file1',
                }, next),
                next => s3Client.deleteBucket({ Bucket: bucket1 }, next),
                next => VaultClient.deleteVaultAccount(clientAdmin, iamClient, accountName, next),
            ], done);
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
            it(test.name, done => {
                let jwtToken = null;
                let roleArn = null;
                async.waterfall([
                    next => getTokenForIdentity(test.oidcIdentity, (err, token) => {
                        assert.ifError(err);
                        jwtToken = token;
                        next();
                    }),
                    next => iamClient.getRole({ RoleName: test.roleName }, (err, res) => {
                        assert.ifError(err);
                        roleArn = res.Role.Arn;
                        next();
                    }),
                    next => stsClient.assumeRoleWithWebIdentity({
                        RoleArn: roleArn,
                        DurationSeconds: duration,
                        WebIdentityToken: jwtToken,
                        RoleSessionName: `session-name-test-${i}-${testAPI.API.toLowerCase()}`,
                    }, (err, res) => {
                        assert.ifError(err);
                        return next(null, res);
                    }),
                    (res, next) => {
                        const sessionUserCredentials = {
                            accessKeyId: res.Credentials.AccessKeyId,
                            secretAccessKey: res.Credentials.SecretAccessKey,
                            sessionToken: res.Credentials.SessionToken,
                        };
                        // make metadataSearch request using session user's credentials
                        // and see if can get the correct response
                        testAPI.checkResponse(sessionUserCredentials, bucket1, (err, res) => {
                            if (err) {
                                assert.ifError(err);
                                return done(err);
                            }
                            test.assertion(res);
                            return next();
                        }, 'file1');
                    }], done);
            });
        });
    });
});

