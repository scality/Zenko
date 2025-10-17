const assert = require('assert');
const { errors } = require('arsenal');
const {
    CreateBucketCommand,
    PutObjectCommand,
    DeleteObjectCommand,
    DeleteBucketCommand,
} = require('@aws-sdk/client-s3');
const {
    CreateUserCommand,
    CreateAccessKeyCommand,
    DeleteUserCommand,
    CreatePolicyCommand,
    AttachUserPolicyCommand,
    DetachUserPolicyCommand,
    DeletePolicyCommand,
} = require('@aws-sdk/client-iam');
const { metadataSearchResponseCode, createPolicy, restoreObjectResponseCode } = require('./utils');

const iam = require('../../s3SDK').scalityIAMClient;
const s3 = require('../../s3SDK').scalityS3Client;

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

function checkResponseAsync(checkResponseFn, credentials, bucket, object) {
    return new Promise((resolve, reject) => {
        checkResponseFn(credentials, bucket, (err, res) => (err ? reject(err) : resolve(res)), object);
    });
}

testAPIs.forEach(testAPI => {

    const userName = `username-policy-test-${testAPI.API.toLowerCase()}`;

    const bucketName = `bucket-test-1-${testAPI.API.toLowerCase()}`;
    const bucketName2 = `bucket-test-2-${testAPI.API.toLowerCase()}`;
    const objectName = `object-test-1-${testAPI.API.toLowerCase()}`;
    const objectName2 = `object-test-2-${testAPI.API.toLowerCase()}`;
    const allowPolicyName = `allow-policy-${testAPI.API.toLowerCase()}`;
    const denyPolicyName = `deny-policy-${testAPI.API.toLowerCase()}`;

    describe(`IAM Policies ${testAPI.API}`, () => {

        const userCredentials = {
            accessKeyId: '',
            secretAccessKey: '',
        };

        before(async () => {
            await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
            await s3.send(new PutObjectCommand({ Bucket: bucketName, Key: objectName }));
            await s3.send(new CreateBucketCommand({ Bucket: bucketName2 }));
            await s3.send(new PutObjectCommand({ Bucket: bucketName2, Key: objectName2 }));
            await iam.send(new CreateUserCommand({ UserName: userName }));
            const accessKeyRes = await iam.send(new CreateAccessKeyCommand({ UserName: userName }));
            userCredentials.accessKeyId = accessKeyRes.AccessKey.AccessKeyId;
            userCredentials.secretAccessKey = accessKeyRes.AccessKey.SecretAccessKey;
        });

        after(async () => {
            await iam.send(new DeleteUserCommand({ UserName: userName }));
            await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: objectName }));
            await s3.send(new DeleteBucketCommand({ Bucket: bucketName }));
            await s3.send(new DeleteObjectCommand({ Bucket: bucketName2, Key: objectName2 }));
            await s3.send(new DeleteBucketCommand({ Bucket: bucketName2 }));
        });

        it(
            `should not be able to ${testAPI.API} without the permission s3:${testAPI.API}`,
            async () => {
                const res = await checkResponseAsync(testAPI.checkResponse, userCredentials, bucketName, objectName);
                assert.strictEqual(res.statusCode, 403);
                assert.strictEqual(res.code, errors.AccessDenied.message);
            },
        );

        it(`should be able to ${testAPI.API} with the permission s3:${testAPI.API} allowed`, async () => {
            const policyArns = [];
            try {
                const res = await iam.send(new CreatePolicyCommand({
                    PolicyName: allowPolicyName,
                    PolicyDocument: createPolicy(`s3:${testAPI.API}`),
                }));
                policyArns.push(res.Policy.Arn);
                await iam.send(new AttachUserPolicyCommand({
                    UserName: userName,
                    PolicyArn: res.Policy.Arn,
                }));
                const res2 = await checkResponseAsync(testAPI.checkResponse, userCredentials, bucketName, objectName);
                if (testAPI.API === 'RestoreObject') {
                    assert.strictEqual(res2.statusCode, 403);
                    assert.strictEqual(res2.code, errors.InvalidObjectState.message);
                } else {
                    assert.strictEqual(res2.statusCode, 200);
                }
            } finally {
                await Promise.all(policyArns.map(async arn => {
                    await iam.send(new DetachUserPolicyCommand({ UserName: userName, PolicyArn: arn }));
                    await iam.send(new DeletePolicyCommand({ PolicyArn: arn }));
                }));
            }
        });

        it(`should be able to ${testAPI.API} with the permission s3:${testAPI.API} allowed`
            + 'on specific bucket but not on others', async () => {
            const policyArns = [];
            try {
                const res = await iam.send(new CreatePolicyCommand({
                    PolicyName: allowPolicyName,
                    PolicyDocument: createPolicy(
                        `s3:${testAPI.API}`,
                        true,
                        `arn:aws:s3:::${bucketName}${testAPI.resource}`,
                    ),
                }));
                policyArns.push(res.Policy.Arn);
                await iam.send(new AttachUserPolicyCommand({ UserName: userName, PolicyArn: res.Policy.Arn }));
                const res2 = await checkResponseAsync(testAPI.checkResponse, userCredentials, bucketName, objectName);
                if (testAPI.API === 'RestoreObject') {
                    assert.strictEqual(res2.statusCode, 403);
                    assert.strictEqual(res2.code, errors.InvalidObjectState.message);
                } else {
                    assert.strictEqual(res2.statusCode, 200);
                }
                const res3 = await checkResponseAsync(testAPI.checkResponse, userCredentials, bucketName2, objectName2);
                assert.strictEqual(res3.statusCode, 403);
                assert.strictEqual(res3.code, errors.AccessDenied.message);
            } finally {
                await Promise.all(policyArns.map(async arn => {
                    await iam.send(new DetachUserPolicyCommand({ UserName: userName, PolicyArn: arn }));
                    await iam.send(new DeletePolicyCommand({ PolicyArn: arn }));
                }));
            }
        });

        it(`should not be able to ${testAPI.API} with the permission s3:${testAPI.API} denied`, async () => {
            const policyArns = [];
            try {
                const res = await iam.send(new CreatePolicyCommand({
                    PolicyName: denyPolicyName,
                    PolicyDocument: createPolicy(`s3:${testAPI.API}`, false),
                }));
                policyArns.push(res.Policy.Arn);
                await iam.send(new AttachUserPolicyCommand({ UserName: userName, PolicyArn: res.Policy.Arn }));
                const res2 = await checkResponseAsync(testAPI.checkResponse, userCredentials, bucketName, objectName);
                assert.strictEqual(res2.statusCode, 403);
                assert.strictEqual(res2.code, errors.AccessDenied.message);
            } finally {
                await Promise.all(policyArns.map(async arn => {
                    await iam.send(new DetachUserPolicyCommand({ UserName: userName, PolicyArn: arn }));
                    await iam.send(new DeletePolicyCommand({ PolicyArn: arn }));
                }));
            }
        });

        it(`should be able to ${testAPI.API} on all buckets except for denied ones`, async () => {
            const policyArns = [];
            try {
                const res = await iam.send(new CreatePolicyCommand({
                    PolicyName: allowPolicyName,
                    PolicyDocument: createPolicy(`s3:${testAPI.API}`),
                }));
                policyArns.push(res.Policy.Arn);
                await iam.send(new AttachUserPolicyCommand({ UserName: userName, PolicyArn: res.Policy.Arn }));
                const res2 = await iam.send(new CreatePolicyCommand({
                    PolicyName: denyPolicyName,
                    PolicyDocument: createPolicy(
                        `s3:${testAPI.API}`,
                        false,
                        `arn:aws:s3:::${bucketName}${testAPI.resource}`,
                    ),
                }));
                policyArns.push(res2.Policy.Arn);
                await iam.send(new AttachUserPolicyCommand({ UserName: userName, PolicyArn: res2.Policy.Arn }));
                const res3 = await checkResponseAsync(testAPI.checkResponse, userCredentials, bucketName, objectName);
                assert.strictEqual(res3.statusCode, 403);
                assert.strictEqual(res3.code, errors.AccessDenied.message);
                const res4 = await checkResponseAsync(testAPI.checkResponse, userCredentials, bucketName2, objectName2);
                if (testAPI.API === 'RestoreObject') {
                    assert.strictEqual(res4.statusCode, 403);
                    assert.strictEqual(res4.code, errors.InvalidObjectState.message);
                } else {
                    assert.strictEqual(res4.statusCode, 200);
                }
            } finally {
                await Promise.all(policyArns.map(async arn => {
                    await iam.send(new DetachUserPolicyCommand({ UserName: userName, PolicyArn: arn }));
                    await iam.send(new DeletePolicyCommand({ PolicyArn: arn }));
                }));
            }
        });
    });
});
