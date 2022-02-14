const assert = require('assert');
const async = require('async');
const uuidV4 = require('uuid/v4');
const {makeGETRequest} = require("../../utils/request");

const iam = require('../../s3SDK').scalityIAMClient;
const s3 = require('../../s3SDK').scalityS3Client;

const userName = "username-policy-test-metadatasearch2";

const bucketName = "bucket-test";
const allowMdSearchPolicyName = "allowMDSearchPolicy";
const denyMdSearchPolicyName = "denyMDSearchPolicy";

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

function metadataSearchResponseCode(userCredentials, cb) {
    return makeGETRequest(`/${bucketName}/?search=${encodeURIComponent('key LIKE "file"')}`, (err, res) => {
        if (err)
            return cb(err);
        return cb(null, res.statusCode);
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
            next => iam.createUser({UserName: userName}, next),
            next => iam.createAccessKey({UserName: userName}, next)
        ], (err, res) => {
            assert.ifError(err);
            userCredentials.accessKeyId = res[2].AccessKey.AccessKeyId;
            userCredentials.secretAccessKey = res[2].AccessKey.SecretAccessKey;
            done();
        });
    });

    after(done => {
        async.series([
            next => iam.deleteUser({UserName: userName}, next),
            next => s3.deleteBucket({Bucket: bucketName}, next),
        ], err => {
            assert.ifError(err);
            done();
        });
    })

    it('should not be able to metadata search without the policy s3:MetadataSearch', done => {
        return metadataSearchResponseCode(userCredentials, (err, res) => {
            if (err) {
                assert.ifError(err)
                return done(err)
            }
            assert.strictEqual(res, 403);
            return done();
        });
    });

    it('should be able to metadata search with the policy s3:MetadataSearch allowed', done => {
        async.series([
            next => iam.createPolicy({PolicyName: allowMdSearchPolicyName, PolicyDocument: createPolicy("s3:MetadataSearch")}, (err, res) => {
                if (err)
                    return next(err);
                return iam.attachUserPolicy({UserName: userName, PolicyArn: res.Policy.Arn}, next);
            }),
            next => metadataSearchResponseCode(userCredentials, (err, res) => {
                    if (err) {
                        assert.ifError(err)
                        return next(err)
                    }
                    assert.strictEqual(res, 200);
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

    it('should not be able to metadata search with the policy s3:MetadataSearch denied', done => {
        async.series([
                next => iam.createPolicy({PolicyName: denyMdSearchPolicyName, PolicyDocument: createPolicy("s3:MetadataSearch", false)}, (err, res) => {
                    if (err)
                        return next(err);
                    return iam.attachUserPolicy({UserName: userName, PolicyArn: res.Policy.Arn}, next);
                }),
                next => metadataSearchResponseCode(userCredentials, (err, res) => {
                    if (err) {
                        assert.ifError(err)
                        return next(err)
                    }
                    assert.strictEqual(res, 403);
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
});