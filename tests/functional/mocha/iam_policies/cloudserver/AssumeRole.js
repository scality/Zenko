const assert = require('assert');
const { errors } = require('arsenal');
const {
    CreateRoleCommand,
    DeleteRoleCommand,
    AttachRolePolicyCommand,
    DetachRolePolicyCommand,
    CreatePolicyCommand,
    DeletePolicyCommand,
    CreateUserCommand,
    CreateAccessKeyCommand,
    AttachUserPolicyCommand,
} = require('@aws-sdk/client-iam');
const { AssumeRoleCommand } = require('@aws-sdk/client-sts');
const {
    CreateBucketCommand,
    PutObjectCommand,
    DeleteObjectCommand,
    DeleteBucketCommand,
} = require('@aws-sdk/client-s3');
const VaultClient = require('../../VaultClient');
const { getS3Client } = require('../../s3SDK');
const { getSTSClient } = require('../../stsSDK');
const { metadataSearchResponseCode, restoreObjectResponseCode, putObjectVersionResponseCode } = require('./utils');

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
    {
        API: 'PutObjectVersion',
        checkResponse: putObjectVersionResponseCode,
        resource: '/*',
    },
];

testAPIs.forEach(testAPI => {
    let clientAdmin;

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

        before(async () => {
            clientAdmin = VaultClient.getAdminClient();
            const res = await new Promise((resolve, reject) => {
                clientAdmin.createAccount(account1Name, account1Info, (err, res) => (err ? reject(err) : resolve(res)));
            });
            iamAccount1Id = res.account.id;

            await new Promise((resolve, reject) => {
                clientAdmin.generateAccountAccessKey(
                    account1Name,
                    err => (err ? reject(err) : resolve()),
                    { externalAccessKey: externalAccessKey1, externalSecretKey: externalSecretKey1 },
                );
            });

            iamAccount1Client = VaultClient.getIamClient(externalAccessKey1, externalSecretKey1);
            await new Promise((resolve, reject) => {
                clientAdmin.createAccount(account2Name, account2Info, err => (err ? reject(err) : resolve()));
            });

            await new Promise((resolve, reject) => {
                clientAdmin.generateAccountAccessKey(
                    account2Name,
                    err => (err ? reject(err) : resolve()),
                    { externalAccessKey: externalAccessKey2, externalSecretKey: externalSecretKey2 },
                );
            });

            iamAccount2Client = VaultClient.getIamClient(externalAccessKey2, externalSecretKey2);
            await iamAccount2Client.send(new CreateUserCommand({ UserName: userName }));
            const result = await iamAccount2Client.send(new CreateAccessKeyCommand({ UserName: userName }));
            stsClient = getSTSClient(result.AccessKey.AccessKeyId, result.AccessKey.SecretAccessKey);
            const policyResult = await iamAccount2Client.send(new CreatePolicyCommand({
                PolicyName: 'allowAssumeRolePolicy',
                PolicyDocument: allowAssumeRolePolicy,
            }));
            allowAssumeRolePolicyArn = policyResult.Policy.Arn;
            await iamAccount2Client.send(new AttachUserPolicyCommand({
                UserName: userName,
                PolicyArn: allowAssumeRolePolicyArn,
            }));

            s3Account1Client = getS3Client(externalAccessKey1, externalSecretKey1);
            await s3Account1Client.send(new CreateBucketCommand({ Bucket: bucket1 }));
            await s3Account1Client.send(new PutObjectCommand({
                Bucket: bucket1,
                Key: 'file1',
                Body: '',
                ContentLength: 0,
            }));
            await s3Account1Client.send(new CreateBucketCommand({ Bucket: bucket2 }));
            await s3Account1Client.send(new PutObjectCommand({
                Bucket: bucket2,
                Key: 'file1',
                Body: '',
                ContentLength: 0,
            }));
        });

        after(async () => {
            await s3Account1Client.send(new DeleteObjectCommand({
                Bucket: bucket1,
                Key: 'file1',
            }));
            await s3Account1Client.send(new DeleteObjectCommand({
                Bucket: bucket2,
                Key: 'file1',
            }));
            await s3Account1Client.send(new DeleteBucketCommand({ Bucket: bucket1 }));
            await s3Account1Client.send(new DeleteBucketCommand({ Bucket: bucket2 }));
            await VaultClient.deleteVaultAccount(clientAdmin, iamAccount1Client, account1Name);
            await VaultClient.deleteVaultAccount(clientAdmin, iamAccount2Client, account2Name);
        });

        async function cleanUp(roleName, policyArn, err) {
            try {
                await iamAccount1Client.send(new DetachRolePolicyCommand({
                    RoleName: roleName, PolicyArn: policyArn,
                }));
                await iamAccount1Client.send(new DeletePolicyCommand({ PolicyArn: policyArn }));
                await iamAccount1Client.send(new DeleteRoleCommand({ RoleName: roleName }));
            } catch (cleanupErr) {
                if (err) throw err;
                throw cleanupErr;
            }
            if (err) throw err;
        }

        const tests = [
            {
                name: `should not be able to perform ${testAPI.API} on any bucket if the role that `
                    + `the user assumed is not attached with ${testAPI.API} policy`,
                policy: {
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Action: ['s3:List*', 's3:Get*', 's3:PutObject'],
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
                    if (testAPI.API === 'RestoreObject' || testAPI.API === 'PutObjectVersion') {
                        assert.strictEqual(result.statusCode, 403);
                        assert.strictEqual(result.code, errors.InvalidObjectState.message);
                    } else {
                        assert.strictEqual(result.statusCode, 200);
                    }
                },
                result => {
                    if (testAPI.API === 'RestoreObject' || testAPI.API === 'PutObjectVersion') {
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
                        if (testAPI.API === 'RestoreObject' || testAPI.API === 'PutObjectVersion') {
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
                    if (testAPI.API === 'RestoreObject' || testAPI.API === 'PutObjectVersion') {
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
                async () => {
                    const roleName = `test-role-${i}`;
                    const policyName = `test-policy-${i}`;
                    let policyArn = null;

                    try {
                        // create a role under account1 and attach different policy to it
                        await iamAccount1Client.send(new CreateRoleCommand({
                            RoleName: roleName,
                            AssumeRolePolicyDocument: trustPolicy,
                        }));

                        const res = await iamAccount1Client.send(new CreatePolicyCommand({
                            PolicyName: policyName,
                            PolicyDocument: JSON.stringify(test.policy),
                        }));
                        policyArn = res.Policy.Arn;
                        await iamAccount1Client.send(new AttachRolePolicyCommand({
                            RoleName: roleName,
                            PolicyArn: policyArn,
                        }));

                        // user under account2 assume the role under account1
                        const assumeRoleRes = await stsClient.send(new AssumeRoleCommand({
                            RoleArn: `arn:aws:iam::${iamAccount1Id}:role/${roleName}`,
                            RoleSessionName: 'test-session',
                        }));

                        const sessionUserCredentials = {
                            accessKeyId: assumeRoleRes.Credentials.AccessKeyId,
                            secretAccessKey: assumeRoleRes.Credentials.SecretAccessKey,
                            sessionToken: assumeRoleRes.Credentials.SessionToken,
                        };

                        const results = await Promise.all(test.buckets.map(bucket => new Promise((resolve, reject) => {
                            // make request on specific buckets using session user's credentials
                            // and see if can get the correct response
                            testAPI.checkResponse(
                                sessionUserCredentials,
                                bucket,
                                (err, res) => (err ? reject(err) : resolve(res)),
                                'file1',
                            );
                        })));

                        results.forEach((result, idx) => {
                            test.assertions[idx](result);
                        });

                        await cleanUp(roleName, policyArn);
                    } catch (err) {
                        await cleanUp(roleName, policyArn, err);
                    }
                },
            );
        });
    });
});
