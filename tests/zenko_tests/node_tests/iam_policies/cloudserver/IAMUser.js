const assert = require('assert');
const async = require('async');
const { errors } = require('arsenal');
const { metadataSearchResponseCode, createPolicy, restoreObjectResponseCode } = require('./utils');

const iam = require('../../s3SDK').scalityIAMClient;
const s3 = require('../../s3SDK').scalityS3Client;

const testAPIs = [
    {
        API: 'MetadataSearch',
        checkResponse: metadataSearchResponseCode,
    },
    {
        API: 'RestoreObject',
        checkResponse: restoreObjectResponseCode,
    },
];

testAPIs.forEach(testAPI => {

    const userName = `username-policy-test-${testAPI.API}`;

    const bucketName = `bucket-test-1-${testAPI.API}`;
    const bucketName2 = `bucket-test-2-${testAPI.API}`;
    const allowPolicyName = `allow-policy-${testAPI.API}`;
    const denyPolicyName = `deny-policy-${testAPI.API}`;

    describe(`IAM Policies ${testAPI.API}`, () => {

        const userCredentials = {
            accessKeyId: '',
            secretAccessKey: '',
        };

        before(done => {
            async.series([
                next => s3.createBucket({ Bucket: bucketName }, next),
                next => s3.createBucket({ Bucket: bucketName2 }, next),
                next => iam.createUser({ UserName: userName }, next),
                next => iam.createAccessKey({ UserName: userName }, next),
            ], (err, res) => {
                assert.ifError(err);
                userCredentials.accessKeyId = res[3].AccessKey.AccessKeyId;
                userCredentials.secretAccessKey = res[3].AccessKey.SecretAccessKey;
                done();
            });
        });

        after(done => {
            async.series([
                next => iam.deleteUser({ UserName: userName }, next),
                next => s3.deleteBucket({ Bucket: bucketName }, next),
                next => s3.deleteBucket({ Bucket: bucketName2 }, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(
            `should not be able to ${testAPI.API} without the permission s3:${testAPI.API}`,
            done => testAPI.checkResponse(userCredentials, bucketName, (err, res) => {
                if (err) {
                    assert.ifError(err);
                    return done(err);
                }
                assert.strictEqual(res.statusCode, 403);
                assert.strictEqual(res.message, errors.AccessDenied.description);
                return done();
            }),
        );

        it(`should be able to ${testAPI.API} with the permission s3:${testAPI.API} allowed`, done => {
            const policyArns = [];
            async.series(
                [
                    next => iam.createPolicy({
                        PolicyName: allowPolicyName,
                        PolicyDocument: createPolicy(`s3:${testAPI.API}`),
                    }, (err, res) => {
                        if (err) { return next(err); }
                        policyArns.push(res.Policy.Arn);
                        return iam.attachUserPolicy({
                            UserName: userName,
                            PolicyArn: res.Policy.Arn,
                        }, next);
                    }),
                    next => testAPI.checkResponse(userCredentials, bucketName, (err, res) => {
                        if (err) {
                            assert.ifError(err);
                            return next(err);
                        }
                        assert.strictEqual(res.statusCode, 200);
                        return next();
                    }),
                ],
                err => {
                    assert.ifError(err);
                    async.eachSeries(policyArns, (arn, eachCb) => iam.detachUserPolicy(
                        { UserName: userName, PolicyArn: arn },
                        () => iam.deletePolicy({ PolicyArn: arn }, (err, res) => {
                            assert.ifError(err);
                            return eachCb(err, res);
                        }),
                    ), done);
                },
            );
        });

        it(`should be able to ${testAPI.API} with the permission s3:${testAPI.API} allowed`
            + 'on specific bucket but not on others', done => {
            const policyArns = [];
            async.series(
                [
                    next => iam.createPolicy({
                        PolicyName: allowPolicyName,
                        PolicyDocument: createPolicy(
                            `s3:${testAPI.API}`,
                            true,
                            `arn:aws:s3:::${bucketName}`,
                        ),
                    }, (err, res) => {
                        if (err) { return next(err); }
                        policyArns.push(res.Policy.Arn);
                        return iam.attachUserPolicy({ UserName: userName, PolicyArn: res.Policy.Arn }, next);
                    }),
                    next => testAPI.checkResponse(userCredentials, bucketName, (err, res) => {
                        if (err) {
                            assert.ifError(err);
                            return next(err);
                        }
                        assert.strictEqual(res.statusCode, 200);
                        return next();
                    }),
                    next => testAPI.checkResponse(userCredentials, bucketName2, (err, res) => {
                        if (err) {
                            assert.ifError(err);
                            return next(err);
                        }
                        assert.strictEqual(res.statusCode, 403);
                        assert.strictEqual(res.message, errors.AccessDenied.description);
                        return next();
                    }),
                ],
                err => {
                    assert.ifError(err);
                    async.eachSeries(policyArns, (arn, eachCb) => iam.detachUserPolicy(
                        { UserName: userName, PolicyArn: arn },
                        () => iam.deletePolicy({ PolicyArn: arn }, (err, res) => {
                            assert.ifError(err);
                            return eachCb(err, res);
                        }),
                    ), done);
                },
            );
        });

        it(`should not be able to ${testAPI.API} with the permission s3:${testAPI.API} denied`, done => {
            const policyArns = [];
            async.series(
                [
                    next => iam.createPolicy(
                        {
                            PolicyName: denyPolicyName,
                            PolicyDocument: createPolicy(`s3:${testAPI.API}`, false),
                        },
                        (err, res) => {
                            if (err) { return next(err); }
                            policyArns.push(res.Policy.Arn);
                            return iam.attachUserPolicy({ UserName: userName, PolicyArn: res.Policy.Arn }, next);
                        },
                    ),
                    next => testAPI.checkResponse(userCredentials, bucketName, (err, res) => {
                        if (err) {
                            assert.ifError(err);
                            return next(err);
                        }
                        assert.strictEqual(res.statusCode, 403);
                        assert.strictEqual(res.message, errors.AccessDenied.description);
                        return next();
                    }),
                ],
                err => {
                    assert.ifError(err);
                    async.eachSeries(policyArns, (arn, eachCb) => iam.detachUserPolicy(
                        { UserName: userName, PolicyArn: arn },
                        () => iam.deletePolicy({ PolicyArn: arn }, (err, res) => {
                            assert.ifError(err);
                            return eachCb(err, res);
                        }),
                    ), done);
                },
            );
        });

        it(`should be able to ${testAPI.API} on all buckets except for denied ones`, done => {
            const policyArns = [];
            async.series(
                [
                    next => iam.createPolicy({
                        PolicyName: allowPolicyName,
                        PolicyDocument: createPolicy(`s3:${testAPI.API}`),
                    }, (err, res) => {
                        if (err) { return next(err); }
                        policyArns.push(res.Policy.Arn);
                        return iam.attachUserPolicy({ UserName: userName, PolicyArn: res.Policy.Arn }, next);
                    }),
                    next => iam.createPolicy({
                        PolicyName: denyPolicyName,
                        PolicyDocument: createPolicy(
                            `s3:${testAPI.API}`,
                            false,
                            `arn:aws:s3:::${bucketName}`,
                        ),
                    }, (err, res) => {
                        if (err) { return next(err); }
                        policyArns.push(res.Policy.Arn);
                        return iam.attachUserPolicy({ UserName: userName, PolicyArn: res.Policy.Arn }, next);
                    }),
                    next => testAPI.checkResponse(userCredentials, bucketName, (err, res) => {
                        if (err) {
                            assert.ifError(err);
                            return next(err);
                        }
                        assert.strictEqual(res.statusCode, 403);
                        assert.strictEqual(res.message, errors.AccessDenied.description);
                        return next();
                    }),
                    next => testAPI.checkResponse(userCredentials, bucketName2, (err, res) => {
                        if (err) {
                            assert.ifError(err);
                            return next(err);
                        }
                        assert.strictEqual(res.statusCode, 200);
                        return next();
                    }),
                ],
                err => {
                    assert.ifError(err);
                    async.eachSeries(policyArns, (arn, eachCb) => iam.detachUserPolicy(
                        { UserName: userName, PolicyArn: arn },
                        () => iam.deletePolicy({ PolicyArn: arn }, (err, res) => {
                            assert.ifError(err);
                            return eachCb(err, res);
                        }),
                    ), done);
                },
            );
        });
    });
});
