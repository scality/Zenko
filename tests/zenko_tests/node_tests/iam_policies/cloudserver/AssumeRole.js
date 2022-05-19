const assert = require('assert');
const async = require('async');
const { errors } = require('arsenal');
const VaultClient = require('../../VaultClient');
const { getS3Client } = require('../../s3SDK');
const { getSTSClient } = require('../../stsSDK');
const { metadataSearchResponseCode, restoreObjectResponseCode } = require('./utils');

const clientAdmin = VaultClient.getAdminClient();

const trustPolicy = JSON.stringify({
    Version: '2012-10-17',
    Statement: {
        Sid: 'test',
        Effect: 'Allow',
        Action: 'sts:AssumeRole',
        Principal: { AWS: '*' },
    },
});

const allowAssumeRolePolicy = JSON.stringify({
    Version: '2012-10-17',
    Statement: [{
        Effect: 'Allow',
        Action: 'sts:AssumeRole',
        Resource: '*',
    }],
});


const testAPIs = [
    {
        API: 'MetadataSearch',
        checkResponse: metadataSearchResponseCode,
        resource: '',
    },
    {
        API: 'RestoreObject',
        checkResponse: restoreObjectResponseCode,
        resource: '/*',
    },
];

testAPIs.forEach(testAPI => {

    const account1Name = `iam-policies-assume-role-test-account1-${testAPI.API.toLowerCase()}`;
    const account1Info = {
        email: `${account1Name}@test.com`,
    };
    const externalAccessKey1 = 'DZMMJUPWIUK8IWXRP0HQ';
    const externalSecretKey1 = 'iTuJdlidzrLipymvAGrLP66Yxghl4NQxLZR3cLlu';

    const account2Name = `iam-policies-assume-role-test-account2-${testAPI.API.toLowerCase()}`;
    const account2Info = {
        email: `${account2Name}@test.com`,
    };
    const externalAccessKey2 = 'DZMMJUPWIUK8IWXRP0HR';
    const externalSecretKey2 = 'iTuJdlidzrLipymvAGrLP66Yxghl4NQxLZR3cLlv';

    const userName = `iam-policies-assume-role-test-user${testAPI.API.toLowerCase()}`;

    let allowAssumeRolePolicyArn = null;

    const bucket1 = `bucket1-${testAPI.API.toLowerCase()}`;
    const bucket2 = `bucket2-${testAPI.API.toLowerCase()}`;

    let iamAccount1Client = null;
    let iamAccount1Id = null;
    let iamAccount2Client = null;
    let stsClient = null;
    let s3Account1Client = null;

    describe(`iam policies - cloudserver - AssumeRole - ${testAPI.API}`, () => {

        before(done => {
            async.series([
                // create account1, generateAccountAccessKey for it and get account1 iam client
                next => clientAdmin.createAccount(account1Name, account1Info, (err, res) => {
                    if (err) {
                        return next(err);
                    }
                    iamAccount1Id = res.account.id;
                    return next();
                }),
                next => clientAdmin.generateAccountAccessKey(
                    account1Name,
                    next,
                    { externalAccessKey: externalAccessKey1, externalSecretKey: externalSecretKey1 },
                ),
                next => {
                    iamAccount1Client = VaultClient.getIamClient(externalAccessKey1, externalSecretKey1);
                    next();
                },
                // create account2, generateAccountAccessKey for it, get account2 iam client
                // create a user under account2, create access key for the user and get user sts client
                next => clientAdmin.createAccount(account2Name, account2Info, next),
                next => clientAdmin.generateAccountAccessKey(
                    account2Name,
                    () => next(),
                    { externalAccessKey: externalAccessKey2, externalSecretKey: externalSecretKey2 },
                ),
                next => {
                    iamAccount2Client = VaultClient.getIamClient(externalAccessKey2, externalSecretKey2);
                    next();
                },
                next => iamAccount2Client.createUser({ UserName: userName }, next),
                next => iamAccount2Client.createAccessKey(
                    { UserName: userName },
                    (err, result) => {
                        if (err) {
                            return next(err);
                        }
                        stsClient = getSTSClient(result.AccessKey.AccessKeyId, result.AccessKey.SecretAccessKey);
                        return next();
                    },
                ),
                // create allowAssumeRole policy and attach it to the user created above
                next => iamAccount2Client.createPolicy({
                    PolicyName: 'allowAssumeRolePolicy',
                    PolicyDocument: allowAssumeRolePolicy,
                }, (err, result) => {
                    if (err) {
                        return next(err);
                    }
                    allowAssumeRolePolicyArn = result.Policy.Arn;
                    return iamAccount2Client.attachUserPolicy({
                        UserName: userName,
                        PolicyArn: allowAssumeRolePolicyArn,
                    }, next);
                }),
                // get account1 s3 client, create 2 buckets and put 2 objects respectively
                next => {
                    s3Account1Client = getS3Client(externalAccessKey1, externalSecretKey1);
                    next();
                },
                next => s3Account1Client.createBucket({ Bucket: bucket1 }, next),
                next => s3Account1Client.putObject({ Bucket: bucket1, Key: 'file1' }, next),
                next => s3Account1Client.createBucket({ Bucket: bucket2 }, next),
                next => s3Account1Client.putObject({ Bucket: bucket2, Key: 'file1' }, next),
            ], done);
        });

        after(done => {
            async.series([
                next => s3Account1Client.deleteObject({
                    Bucket: bucket1,
                    Key: 'file1',
                }, next),
                next => s3Account1Client.deleteObject({
                    Bucket: bucket2,
                    Key: 'file1',
                }, next),
                next => s3Account1Client.deleteBucket({ Bucket: bucket1 }, next),
                next => s3Account1Client.deleteBucket({ Bucket: bucket2 }, next),
                next => VaultClient.deleteVaultAccount(clientAdmin, iamAccount1Client, account1Name, next),
                next => VaultClient.deleteVaultAccount(clientAdmin, iamAccount2Client, account2Name, next),
            ], done);
        });

        function cleanUp(roleName, policyArn, err, done) {
            return async.series([
                next => iamAccount1Client.detachRolePolicy({
                    RoleName: roleName, PolicyArn: policyArn,
                }, next),
                next => iamAccount1Client.deletePolicy({ PolicyArn: policyArn }, next),
                next => iamAccount1Client.deleteRole({ RoleName: roleName }, next),
            ], _err => {
                if (err) {
                    return done(err);
                }
                if (_err) {
                    return done(_err);
                }
                return done();
            });
        }

        const tests = [
            {
                name: `should not be able to perform ${testAPI.API} on any bucket if the role that `
                    + `the user assumed is not attached with ${testAPI.API} policy`,
                policy: {
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Action: ['s3:List*', 's3:Get*'],
                        Resource: 'arn:aws:s3:::*',
                    }],
                },
                buckets: [bucket1, bucket2],
                assertions: [result => {
                    assert.strictEqual(result.statusCode, 403);
                    assert.strictEqual(result.code, errors.AccessDenied.message);
                },
                result => {
                    assert.strictEqual(result.statusCode, 403);
                    assert.strictEqual(result.code, errors.AccessDenied.message);
                }],
            },
            {
                name: `should be able to perform ${testAPI.API} on any bucket if the role that `
                    + `the user assumed is attached with a ${testAPI.API} permission on all buckets`,
                policy: {
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Action: `s3:${testAPI.API}`,
                        Resource: 'arn:aws:s3:::*',
                    }],
                },
                buckets: [bucket1, bucket2],
                assertions: [result => {
                    if (testAPI.API === 'RestoreObject') {
                        assert.strictEqual(result.statusCode, 403);
                        assert.strictEqual(result.code, errors.InvalidObjectState.message);
                    } else {
                        assert.strictEqual(result.statusCode, 200);
                    }
                },
                result => {
                    if (testAPI.API === 'RestoreObject') {
                        assert.strictEqual(result.statusCode, 403);
                        assert.strictEqual(result.code, errors.InvalidObjectState.message);
                    } else {
                        assert.strictEqual(result.statusCode, 200);
                    }
                }],
            },
            {
                name: `should only be able to perform ${testAPI.API} on the specific buckets that is `
                    + `defined in the ${testAPI.API} policy which is attached to the role that the user assumed`,
                policy: {
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Action: `s3:${testAPI.API}`,
                        Resource: `arn:aws:s3:::${bucket1}${testAPI.resource}`,
                    }],
                },
                buckets: [bucket1, bucket2],
                assertions: [
                    result => {
                        if (testAPI.API === 'RestoreObject') {
                            assert.strictEqual(result.statusCode, 403);
                            assert.strictEqual(result.code, errors.InvalidObjectState.message);
                        } else {
                            assert.strictEqual(result.statusCode, 200);
                        }
                    },
                    result => {
                        assert.strictEqual(result.statusCode, 403);
                        assert.strictEqual(result.code, errors.AccessDenied.message);
                    }],
            },
            {
                name: `should not be able to perform ${testAPI.API} on any buckets if the role that '
                    + 'the user assumed is attached with an explicit deny ${testAPI.API} policy`,
                policy: {
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Deny',
                        Action: `s3:${testAPI.API}`,
                        Resource: 'arn:aws:s3:::*',
                    }],
                },
                buckets: [bucket1, bucket2],
                assertions: [result => {
                    assert.strictEqual(result.statusCode, 403);
                    assert.strictEqual(result.code, errors.AccessDenied.message);
                },
                result => {
                    assert.strictEqual(result.statusCode, 403);
                    assert.strictEqual(result.code, errors.AccessDenied.message);
                }],
            },
            {
                name: `should not be able to perform ${testAPI.API} on the buckets `
                    + `which is explicitly denied ${testAPI.API} policy `
                    + `although there is an allow ${testAPI.API} permission on all buckets`,
                policy: {
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Action: `s3:${testAPI.API}`,
                        Resource: 'arn:aws:s3:::*',
                    },
                    {
                        Effect: 'Deny',
                        Action: `s3:${testAPI.API}`,
                        Resource: `arn:aws:s3:::${bucket1}${testAPI.resource}`,
                    }],
                },
                buckets: [bucket1, bucket2],
                assertions: [result => {
                    assert.strictEqual(result.statusCode, 403);
                    assert.strictEqual(result.code, errors.AccessDenied.message);
                },
                result => {
                    if (testAPI.API === 'RestoreObject') {
                        assert.strictEqual(result.statusCode, 403);
                        assert.strictEqual(result.code, errors.InvalidObjectState.message);
                    } else {
                        assert.strictEqual(result.statusCode, 200);
                    }
                }],
            },
        ];

        tests.forEach((test, i) => {
            it(
                test.name,
                done => {
                    const roleName = `test-role-${i}`;
                    const policyName = `test-policy-${i}`;
                    let policyArn = null;
                    async.series([
                        // create a role under account1 and attach different policy to it
                        next => iamAccount1Client.createRole({
                            RoleName: roleName,
                            AssumeRolePolicyDocument: trustPolicy,
                        }, next),
                        next => iamAccount1Client.createPolicy({
                            PolicyName: policyName,
                            PolicyDocument: JSON.stringify(test.policy),
                        }, (err, res) => {
                            if (err) {
                                return done(err);
                            }
                            policyArn = res.Policy.Arn;
                            return iamAccount1Client.attachRolePolicy({
                                RoleName: roleName,
                                PolicyArn: policyArn,
                            }, next);
                        }),
                        // user under account2 assume the role under account1
                        next => stsClient.assumeRole({
                            RoleArn: `arn:aws:iam::${iamAccount1Id}:role/${roleName}`,
                            RoleSessionName: 'test-session',
                        }, (err, res) => {
                            if (err) {
                                return done(err);
                            }
                            const sessionUserCredentials = {
                                accessKeyId: res.Credentials.AccessKeyId,
                                secretAccessKey: res.Credentials.SecretAccessKey,
                                sessionToken: res.Credentials.SessionToken,
                            };
                            return async.eachOf(test.buckets, (bucket, idx, eachCb) => {
                                // make request on specific buckets using session user's credentials
                                // and see if can get the correct response
                                testAPI.checkResponse(sessionUserCredentials, bucket, (err, res) => {
                                    if (err) {
                                        assert.ifError(err);
                                        return done(err);
                                    }
                                    test.assertions[idx](res);
                                    return eachCb();
                                }, 'file1');
                            }, next);
                        })], err => cleanUp(roleName, policyArn, err, done));
                },
            );
        });
    });
});
