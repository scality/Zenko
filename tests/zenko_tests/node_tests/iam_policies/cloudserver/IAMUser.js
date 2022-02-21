const assert = require('assert');
const async = require('async');
const { errors } = require('arsenal');
const { metadataSearchResponseCode } = require('./utils');

const iam = require('../../s3SDK').scalityIAMClient;
const s3 = require('../../s3SDK').scalityS3Client;

const userName = 'username-policy-test-metadatasearch';

const bucketName = 'bucket-test-mdsearch1';
const bucketName2 = 'bucket-test-mdsearch2';
const allowMdSearchPolicyName = 'allowMDSearchPolicy';
const denyMdSearchPolicyName = 'denyMDSearchPolicy';

function createPolicy(action, isAllow = true, resource = '*') {
    return JSON.stringify({
        Version: '2012-10-17',
        Statement: [
            {
                Sid: 'Stmt1644586763301',
                Action: [
                    action,
                ],
                Effect: (isAllow ? 'Allow' : 'Deny'),
                Resource: resource,
            },
        ],
    });
}

describe('IAM Policies MetadataSearch', () => {

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
        'should not be able to metadata search without the permission s3:MetadataSearch',
        done => metadataSearchResponseCode(userCredentials, bucketName, (err, res) => {
            if (err) {
                assert.ifError(err);
                return done(err);
            }
            assert.strictEqual(res.statusCode, 403);
            assert.strictEqual(res.message, errors.AccessDenied.description);
            return done();
        }),
    );

    it('should be able to metadata search with the permission s3:MetadataSearch allowed', done => {
        const policyArns = [];
        async.series(
            [
                next => iam.createPolicy({
                    PolicyName: allowMdSearchPolicyName,
                    PolicyDocument: createPolicy('s3:MetadataSearch'),
                }, (err, res) => {
                    if (err) { return next(err); }
                    policyArns.push(res.Policy.Arn);
                    return iam.attachUserPolicy({ UserName: userName, PolicyArn: res.Policy.Arn }, next);
                }),
                next => metadataSearchResponseCode(userCredentials, bucketName, (err, res) => {
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

    it('should be able to metadata search with the permission s3:MetadataSearch allowed'
        + 'on specific bucket but not on others', done => {
        const policyArns = [];
        async.series(
            [
                next => iam.createPolicy({
                    PolicyName: allowMdSearchPolicyName,
                    PolicyDocument: createPolicy(
                        's3:MetadataSearch',
                        true,
                        `arn:aws:s3:::${bucketName}`,
                    ),
                }, (err, res) => {
                    if (err) { return next(err); }
                    policyArns.push(res.Policy.Arn);
                    return iam.attachUserPolicy({ UserName: userName, PolicyArn: res.Policy.Arn }, next);
                }),
                next => metadataSearchResponseCode(userCredentials, bucketName, (err, res) => {
                    if (err) {
                        assert.ifError(err);
                        return next(err);
                    }
                    assert.strictEqual(res.statusCode, 200);
                    return next();
                }),
                next => metadataSearchResponseCode(userCredentials, bucketName2, (err, res) => {
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

    it('should not be able to metadata search with the permission s3:MetadataSearch denied', done => {
        const policyArns = [];
        async.series(
            [
                next => iam.createPolicy(
                    {
                        PolicyName: denyMdSearchPolicyName,
                        PolicyDocument: createPolicy('s3:MetadataSearch', false),
                    },
                    (err, res) => {
                        if (err) { return next(err); }
                        policyArns.push(res.Policy.Arn);
                        return iam.attachUserPolicy({ UserName: userName, PolicyArn: res.Policy.Arn }, next);
                    },
                ),
                next => metadataSearchResponseCode(userCredentials, bucketName, (err, res) => {
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

    it('should be able to metadata search on all buckets except for denied ones', done => {
        const policyArns = [];
        async.series(
            [
                next => iam.createPolicy({
                    PolicyName: allowMdSearchPolicyName,
                    PolicyDocument: createPolicy('s3:MetadataSearch'),
                }, (err, res) => {
                    if (err) { return next(err); }
                    policyArns.push(res.Policy.Arn);
                    return iam.attachUserPolicy({ UserName: userName, PolicyArn: res.Policy.Arn }, next);
                }),
                next => iam.createPolicy({
                    PolicyName: denyMdSearchPolicyName,
                    PolicyDocument: createPolicy(
                        's3:MetadataSearch',
                        false,
                        `arn:aws:s3:::${bucketName}`,
                    ),
                }, (err, res) => {
                    if (err) { return next(err); }
                    policyArns.push(res.Policy.Arn);
                    return iam.attachUserPolicy({ UserName: userName, PolicyArn: res.Policy.Arn }, next);
                }),
                next => metadataSearchResponseCode(userCredentials, bucketName, (err, res) => {
                    if (err) {
                        assert.ifError(err);
                        return next(err);
                    }
                    assert.strictEqual(res.statusCode, 403);
                    assert.strictEqual(res.message, errors.AccessDenied.description);
                    return next();
                }),
                next => metadataSearchResponseCode(userCredentials, bucketName2, (err, res) => {
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
