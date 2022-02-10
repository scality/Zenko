const assert = require('assert');
const async = require('async');
const VaultClient = require('./../../smoke_tests/vault_admin_and_IAM_API_tests/VaultClient');
const {makeGETRequest} = require("../../utils/request");
const {getS3Client} = require("../../s3SDK");

const clientAdmin = VaultClient.getAdminClient();

const account1Name = 'iam-policies-assume-role-test-account1';
const account1Info = {
    email: `${account1Name}@test.com`,
    password: 'test',
};
const externalAccessKey1 = 'DZMMJUPWIUK8IWXRP0HQ';
const externalSecretKey1 = 'iTuJdlidzrLipymvAGrLP66Yxghl4NQxLZR3cLlu';

const account2Name = 'iam-policies-assume-role-test-account2';
const account2Info = {
    email: `${account2Name}@test.com`,
    password: 'test',
};
const externalAccessKey2 = 'DZMMJUPWIUK8IWXRP0HR';
const externalSecretKey2 = 'iTuJdlidzrLipymvAGrLP66Yxghl4NQxLZR3cLlv';

const userName = 'iam-policies-assume-role-test-account'

const trustPolicy = {
    Version: '2012-10-17',
    Statement: {
        Sid: 'test',
        Effect: 'Allow',
        Action: 'sts:AssumeRole',
        Principal: '*',
    },
};

const bucket1 = "bucket1";
const bucket2 = "bucket2";

let iamAccount1Client = null;
let iamAcount1Id = null;
let iamAccount2Client = null;
let iamUserClient = null;
let s3Account1Client = null;

describe('iam policies - cloudserver - AssumeRole - Metadata', () => {

    before(done => {
        async.series([
            next => clientAdmin.createAccount(account1Name, account1Info, (err, res) => {
                if (err) return next(err);
                iamAcount1Id = res.account.id;
                next();
            }),
            next => clientAdmin.generateAccountAccessKey(account1Name, next, {externalAccessKey1, externalSecretKey1}),
            next => clientAdmin.createAccount(account2Name, account2Info, next),
            next => clientAdmin.generateAccountAccessKey(account2Name, next, {externalAccessKey2, externalSecretKey2}),
            next => {
                iamAccount1Client = VaultClient.getIamClient(externalAccessKey1, externalSecretKey1);
                iamAccount2Client = VaultClient.getIamClient(externalAccessKey2, externalSecretKey2);
                async.waterfall([
                    nxt => iamAccount2Client.createUser({ UserName: userName }, nxt),
                    nxt => iamAccount2Client.createAccessKey({ UserName: userName }, nxt),
                    (result, nxt) => {
                        iamUserClient = VaultClient.getIamClient(result.AccessKey.AccessKeyId, result.AccessKey.SecretAccessKey);
                        nxt();
                    }
                ], next);
            },
            next => {
                s3Account1Client = getS3Client(externalAccessKey1, externalSecretKey1);
                async.series([
                    nxt => s3Account1Client.createBucket({ Bucket: bucket1 }, nxt),
                    nxt => s3Account1Client.putObject({ Bucket: bucket1, Key: "file1"}, nxt),
                    nxt => s3Account1Client.putObject({ Bucket: bucket1, Key: "file2"}, nxt),
                    nxt => s3Account1Client.createBucket({ Bucket: bucket2 }, nxt),
                    nxt => s3Account1Client.putObject({ Bucket: bucket2, Key: "file1"}, nxt),
                    nxt => s3Account1Client.putObject({ Bucket: bucket2, Key: "file2"}, nxt),
                ], next)
            },
        ], done)
    });

    after(done => {
        async.series([
            next => s3Account1Client.deleteObjects({
                Bucket: bucket1,
                Delete: {
                    Objects: [{ Key: 'file1' }, { Key: 'file2' }],
                    Quiet: false,
                },
            }, next),
            next => s3Account1Client.deleteObjects({
                Bucket: bucket2,
                Delete: {
                    Objects: [{ Key: 'file1' }, { Key: 'file2' }],
                    Quiet: false,
                },
            }, next),
            next => s3Account1Client.deleteBucket({ Bucket: bucket1}, next),
            next => s3Account1Client.deleteBucket({ Bucket: bucket2}, next),
            next => iamAccount1Client.deleteUser({ UserName: userName }, next),
            next => clientAdmin.deleteAccount(account1Name, next),
            next => clientAdmin.deleteAccount(account2Name, next)
            ], done)
    });

    it('should not be able to perform metadata search on any bucket if the role that ' +
        'the user assumed is not attached with MetadataSearch policy',
        done => {
            const roleName = "without-mdsearch-policy-role";
            async.waterfall([
                next => iamAccount1Client.createRole({ RoleName: roleName, AssumeRolePolicyDocument: JSON.stringify(trustPolicy) }, next),
                next => iamUserClient.assumeRole({
                    RoleArn: `arn:aws:iam::${iamAcount1Id}:role/${roleName}`,
                    RoleSessionName: 'test',
                }, next),
                (res, next) => {
                    const sessionUserCredentials = {
                        accessKeyId: res.Credentials.AccessKeyId,
                        secretAccessKey: res.Credentials.SecretAccessKey,
                        sessionToken: res.Credentials.SessionToken
                    }
                    makeGETRequest(`/${bucket1}/?search=${encodeURIComponent('key LIKE "file"')}`, err => {
                        assert.strictEqual(err.code, 'AccessDenied');
                    }, sessionUserCredentials);
                },
                ])
        });

    // it('should be able to perform metadata search on any bucket if the role that ' +
    //     'the user assumed is attached with a MetadataSearch permission on all buckets',
    //     done => {
    //         let client = null;
    //         iamAccountClient1.createRole({RoleName: ""})
    //         assumeRole(accountBClient, false, accountAClient,
    //             'externalWithId', undefined, '1234').then(res => {
    //             client = Aws.createAwsClient(
    //                 res.Credentials.AccessKeyId,
    //                 res.Credentials.SecretAccessKey,
    //                 res.Credentials.SessionToken,
    //             );
    //
    //         });
    //     });

    // it('should only be able to perform metadata search on the specific buckets that is ' +
    //     'defined in the MetadataSearch policy which is attached to the role that the user assumed',
    //     done => {
    //         let client = null;
    //         iamAccountClient1.createRole({RoleName: ""})
    //         assumeRole(accountBClient, false, accountAClient,
    //             'externalWithId', undefined, '1234').then(res => {
    //             client = Aws.createAwsClient(
    //                 res.Credentials.AccessKeyId,
    //                 res.Credentials.SecretAccessKey,
    //                 res.Credentials.SessionToken,
    //             );
    //
    //         });
    //     });
    //
    // it('should not be able to perform metadata search on any buckets if the role that ' +
    //     'the user assumed is attached with an explicit deny MetadataSearch policy',
    //     done => {
    //         let client = null;
    //         iamAccountClient1.createRole({RoleName: ""})
    //         assumeRole(accountBClient, false, accountAClient,
    //             'externalWithId', undefined, '1234').then(res => {
    //             client = Aws.createAwsClient(
    //                 res.Credentials.AccessKeyId,
    //                 res.Credentials.SecretAccessKey,
    //                 res.Credentials.SessionToken,
    //             );
    //
    //         });
    //     });
})
