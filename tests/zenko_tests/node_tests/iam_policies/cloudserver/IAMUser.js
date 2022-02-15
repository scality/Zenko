const assert = require('assert');
const async = require('async');
const uuidV4 = require('uuid/v4');
const {makeGETRequest, getResponseBody} = require("../../utils/request");
const {stat} = require("fs");
const { errors } = require('arsenal');

const iam = require('../../s3SDK').scalityIAMClient;
const s3 = require('../../s3SDK').scalityS3Client;

const userName = "username-policy-test-metadatasearch2wwww";

const bucketName = "bucket-test-mdsearch1wwwww";
const bucketName2 = "bucket-test-mdsearch2wwwww";
const allowMdSearchPolicyName = "allowMDSearchPoliwcywwww";
const denyMdSearchPolicyName = "denyMDSearchPolicywwwww";

function createPolicy(action, isAllow = true, resource = "*") {
    return JSON.stringify({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "Stmt1644586763301",
                "Action": [
                    action,
                ],
                "Effect": (isAllow ? "Allow" : "Deny"),
                "Resource": resource
            }
        ]
    });
}

function metadataSearchResponseCode(userCredentials, bucketName, cb) {
    return makeGETRequest(`/${bucketName}/?search=${encodeURIComponent('key LIKE "file"')}`, (err, response) => {
        if (err)
            return cb(err);
        const statusCode = response.statusCode;
        return getResponseBody(response, (err, res) => {
            const r = new RegExp('<Message>(.*)<\/Message>');
            let message = res.match(r)
            if (message !== null)
                message = message[1];
            cb(null, { statusCode, message});
        }, true);
    }, userCredentials)
}

describe('IAM Policies MetadataSearch', () => {

    let userCredentials = {
        accessKeyId: "",
        secretAccessKey: "",
    };

    before(done => {
        async.series([
            next => s3.createBucket({Bucket: bucketName}, next),
            next => s3.createBucket({Bucket: bucketName2}, next),
            next => iam.createUser({UserName: userName}, next),
            next => iam.createAccessKey({UserName: userName}, next)
        ], (err, res) => {
            assert.ifError(err);
            userCredentials.accessKeyId = res[3].AccessKey.AccessKeyId;
            userCredentials.secretAccessKey = res[3].AccessKey.SecretAccessKey;
            done();
        });
    });

    after(done => {
        async.series([
            next => iam.deleteUser({UserName: userName}, next),
            next => s3.deleteBucket({Bucket: bucketName}, next),
            next => s3.deleteBucket({Bucket: bucketName2}, next),
        ], err => {
            assert.ifError(err);
            done();
        });
    })

    it('should not be able to metadata search without the permission s3:MetadataSearch', done => {
        return metadataSearchResponseCode(userCredentials, bucketName, (err, res) => {
            if (err) {
                assert.ifError(err)
                return done(err)
            }
            assert.strictEqual(res.statusCode, 403);
            assert.strictEqual(res.message, errors.AccessDenied.description);
            return done();
        });
    });

    it('should be able to metadata search with the permission s3:MetadataSearch allowed', done => {
        async.series([
            next => iam.createPolicy({PolicyName: allowMdSearchPolicyName, PolicyDocument: createPolicy("s3:MetadataSearch")}, (err, res) => {
                if (err)
                    return next(err);
                return iam.attachUserPolicy({UserName: userName, PolicyArn: res.Policy.Arn}, next);
            }),
            next => metadataSearchResponseCode(userCredentials, bucketName, (err, res) => {
                    if (err) {
                        assert.ifError(err)
                        return next(err)
                    }
                    assert.strictEqual(res.statusCode, 200);
                    return next();
                }),
            next => iam.listPolicies({}, (err, res) => {
                    if (err) {
                        return next(err);
                    }
                    const p = res.Policies.find(p => p.PolicyName === allowMdSearchPolicyName);
                    if (p) {
                        return iam.detachUserPolicy({UserName: userName, PolicyArn: p.Arn}, (err, res) => {
                            if (err) {
                                return next(err);
                            }
                            return iam.deletePolicy({PolicyArn: p.Arn}, next);
                        })
                    }
                    return next();
                }),
            ],
            err => {
                assert.ifError(err);
                done();
            })
    });

    it('should be able to metadata search with the permission s3:MetadataSearch allowed' +
        'on specific bucket but not on others', done => {
        async.series([
                next => iam.createPolicy({PolicyName: allowMdSearchPolicyName, PolicyDocument: createPolicy("s3:MetadataSearch", true, `arn:aws:s3:::${bucketName}`)}, (err, res) => {
                    if (err)
                        return next(err);
                    return iam.attachUserPolicy({UserName: userName, PolicyArn: res.Policy.Arn}, next);
                }),
                next => metadataSearchResponseCode(userCredentials, bucketName, (err, res) => {
                    if (err) {
                        assert.ifError(err)
                        return next(err)
                    }
                    assert.strictEqual(res.statusCode, 200);
                    return next();
                }),
                next => metadataSearchResponseCode(userCredentials, bucketName2, (err, res) => {
                    if (err) {
                        assert.ifError(err)
                        return next(err)
                    }
                    assert.strictEqual(res.statusCode, 403);
                    assert.strictEqual(res.message, errors.AccessDenied.description);
                    return next();
                }),
                next => iam.listPolicies({}, (err, res) => {
                    if (err) {
                        return next(err);
                    }
                    const p = res.Policies.find(p => p.PolicyName === allowMdSearchPolicyName);
                    if (p)
                        return iam.detachUserPolicy({UserName: userName, PolicyArn: p.Arn}, (err, res) => {
                            if (err)
                                return next(err);
                            return iam.deletePolicy({PolicyArn: p.Arn}, next);
                        })
                    return next();
                }),
            ],
            err => {
                assert.ifError(err);
                done();
            })
    });

    it('should not be able to metadata search with the permission s3:MetadataSearch denied', done => {
        async.series([
                next => iam.createPolicy({PolicyName: denyMdSearchPolicyName, PolicyDocument: createPolicy("s3:MetadataSearch", false)}, (err, res) => {
                    if (err)
                        return next(err);
                    return iam.attachUserPolicy({UserName: userName, PolicyArn: res.Policy.Arn}, next);
                }),
                next => metadataSearchResponseCode(userCredentials, bucketName, (err, res) => {
                    if (err) {
                        assert.ifError(err)
                        return next(err)
                    }
                    assert.strictEqual(res.statusCode, 403);
                    assert.strictEqual(res.message, errors.AccessDenied.description);
                    return next();
                }),
                next => iam.listPolicies({}, (err, res) => {
                    if (err) {
                        return next(err);
                    }
                    const p = res.Policies.find(p => p.PolicyName === denyMdSearchPolicyName);
                    if (p)
                        return iam.detachUserPolicy({UserName: userName, PolicyArn: p.Arn}, (err, res) => {
                            if (err)
                                return next(err);
                            return iam.deletePolicy({PolicyArn: p.Arn}, next);
                        })
                    return next();
                }),
            ],
            err => {
                assert.ifError(err);
                done();
            })
    });

    it('should be able to metadata search on all buckets except for denied ones', done => {
        async.series([
                next => iam.createPolicy({PolicyName: allowMdSearchPolicyName, PolicyDocument: createPolicy("s3:MetadataSearch")}, (err, res) => {
                    if (err)
                        return next(err);
                    return iam.attachUserPolicy({UserName: userName, PolicyArn: res.Policy.Arn}, next);
                }),
                next => iam.createPolicy({PolicyName: denyMdSearchPolicyName, PolicyDocument: createPolicy("s3:MetadataSearch", false, `arn:aws:s3:::${bucketName}`)}, (err, res) => {
                    if (err)
                        return next(err);
                    return iam.attachUserPolicy({UserName: userName, PolicyArn: res.Policy.Arn}, next);
                }),
                next => metadataSearchResponseCode(userCredentials, bucketName, (err, res) => {
                    if (err) {
                        assert.ifError(err)
                        return next(err)
                    }
                    assert.strictEqual(res.statusCode, 403);
                    assert.strictEqual(res.message, errors.AccessDenied.description);
                    return next();
                }),
                next => metadataSearchResponseCode(userCredentials, bucketName2, (err, res) => {
                    if (err) {
                        assert.ifError(err)
                        return next(err)
                    }
                    assert.strictEqual(res.statusCode, 200);
                    return next();
                }),
                next => iam.listPolicies({}, (err, res) => {
                    if (err) {
                        return next(err);
                    }
                    const p = res.Policies.find(p => p.PolicyName === denyMdSearchPolicyName);
                    if (p)
                        return iam.detachUserPolicy({UserName: userName, PolicyArn: p.Arn}, (err, res) => {
                            if (err)
                                return next(err);
                            return iam.deletePolicy({PolicyArn: p.Arn}, next);
                        })
                    return next();
                }),
                next => iam.listPolicies({}, (err, res) => {
                    if (err) {
                        return next(err);
                    }
                    const p = res.Policies.find(p => p.PolicyName === allowMdSearchPolicyName);
                    if (p)
                        return iam.detachUserPolicy({UserName: userName, PolicyArn: p.Arn}, (err, res) => {
                            if (err)
                                return next(err);
                            return iam.deletePolicy({PolicyArn: p.Arn}, next);
                        })
                    return next();
                }),
            ],
            err => {
                assert.ifError(err);
                done();
            })
    });
});