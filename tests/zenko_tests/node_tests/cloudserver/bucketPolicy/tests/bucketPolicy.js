'use strict'; // eslint-disable-line strict

const assert = require('assert');
const async = require('async');
const uuidV4 = require('uuid/v4');

const { scalityS3Client, altScalityS3Client } = require('../../../s3SDK');
const testUtils = require('../../../utils/testUtils');

const bucket = `bpolicy-bucket-${uuidV4()}`;
const bParam = { Bucket: bucket };
const objKey = 'bucket-pol-key';
const oParam = { Bucket: bucket, Key: objKey };
const mpuKey = 'bucket-pol-mpu-key';
const publicId = 'http://acs.amazonaws.com/groups/global/AllUsers';
const webConfig = {
    IndexDocument:
    {
        Suffix: 'index.html',
    },
};
const corsConfig = {
    CORSRules: [
        {
            AllowedMethods: ['GET'],
            AllowedOrigins: ['*'],
        },
    ],
};
const lcConfig = {
    Rules: [
        {
            ID: 'test-id',
            Status: 'Enabled',
            Prefix: '',
            Expiration: {
                Days: 1,
            },
        },
    ],
};
const repConfig = {
    Role: 'arn:aws:iam::account-id:role/src-resource',
    Rules: [
        {
            Destination: {
                Bucket: `arn:aws:s3:::${bucket}`,
                StorageClass: 'STANDARD',
            },
            Prefix: 'test-prefix',
            Status: 'Enabled',
            ID: 'test-id',
        },
    ],
};
const vConfig = {
    Status: 'Enabled',
};

const basicStatement = {
    Sid: 'statementid',
    Effect: 'Allow',
    Principal: '*',
    Action: ['s3:GetBucketTagging'],
    Resource: [
        `arn:aws:s3:::${bucket}`,
    ],
};

const objArn = `arn:aws:s3:::${bucket}/*`;
const allow = 'allow alt account to perform specified action';

function getPolicyParams(paramsToChange) {
    const newParam = {};
    const bucketPolicy = {
        Version: '2012-10-17',
        Statement: [basicStatement],
    };
    if (paramsToChange) {
        for (let i = 0; i < paramsToChange.length; i++) {
            newParam[paramsToChange[i].key] = paramsToChange[i].value;
            bucketPolicy.Statement[0] = Object.assign(
                {}, basicStatement, newParam);
        }
    }
    return {
        Bucket: bucket,
        Policy: JSON.stringify(bucketPolicy),
    };
}

describe('Bucket policies', () => {
    beforeEach(done => {
        scalityS3Client.createBucket({
            Bucket: bucket,
            CreateBucketConfiguration: { LocationConstraint: 'us-east-1' } },
        done);
    });

    afterEach(done => testUtils.emptyDeleteBucket(bucket, done));

    describe('with no bucket policy', () => {
        it('should deny request from alternate account', done => {
            altScalityS3Client.getBucketLocation(bParam, err => {
                assert.strictEqual(err.code, 'AccessDenied');
                done();
            });
        });
    });

    describe('with basic bucket policy', () => {
        it(`should ${allow}: Abort MPU`, done => {
            const params = getPolicyParams([
                { key: 'Action', value: 's3:AbortMultipartUpload' },
                { key: 'Resource', value: objArn },
            ]);
            async.waterfall([
                next => scalityS3Client.putBucketPolicy(params, next),
                (policyData, next) => scalityS3Client.createMultipartUpload(
                    { Bucket: bucket, Key: mpuKey }, next),
                (mpuData, next) => {
                    const uId = mpuData.UploadId;
                    altScalityS3Client.abortMultipartUpload(
                        { Bucket: bucket, Key: mpuKey, UploadId: uId }, next);
                },
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should not ${allow} because bucket owner action: ` +
        'DeleteBucketPolicy', done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:DeleteBucketPolicy' }]);
            scalityS3Client.putBucketPolicy(params, err => {
                assert.ifError(err);
                altScalityS3Client.deleteBucketPolicy(bParam, err => {
                    assert.strictEqual(err.code, 'MethodNotAllowed');
                    done();
                });
            });
        });

        it(`should ${allow}: DeleteBucketWebsite`, done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:DeleteBucketWebsite' }]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => scalityS3Client.putBucketWebsite(
                    { Bucket: bucket, WebsiteConfiguration: webConfig }, next),
                next => altScalityS3Client.deleteBucketWebsite(bParam, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: DeleteObject`, done => {
            const params = getPolicyParams([
                { key: 'Action', value: 's3:DeleteObject' },
                { key: 'Resource', value: objArn },
            ]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => scalityS3Client.putObject(oParam, next),
                next => altScalityS3Client.deleteObject(oParam, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: DeleteObjectTagging`, done => {
            const params = getPolicyParams([
                { key: 'Action', value: 's3:DeleteObjectTagging' },
                { key: 'Resource', value: objArn },
            ]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => scalityS3Client.putObject(oParam, next),
                next => scalityS3Client.putObjectTagging({
                    Bucket: bucket,
                    Key: objKey,
                    Tagging: { TagSet: [{ Key: 'key', Value: 'value' }] } },
                next),
                next => altScalityS3Client.deleteObjectTagging(oParam, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: GetBucketAcl`, done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:GetBucketAcl' }]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => altScalityS3Client.getBucketAcl(bParam, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: GetBucketCORS`, done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:GetBucketCORS' }]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => scalityS3Client.putBucketCors(
                    { Bucket: bucket, CORSConfiguration: corsConfig }, next),
                next => altScalityS3Client.getBucketCors(bParam, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: GetBucketLocation`, done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:GetBucketLocation' }]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => altScalityS3Client.getBucketLocation(bParam, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should not ${allow} because bucket owner action: GetBucketPolicy`,
        done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:GetBucketPolicy' }]);
            scalityS3Client.putBucketPolicy(params, err => {
                assert.ifError(err);
                altScalityS3Client.getBucketPolicy(bParam, err => {
                    assert.strictEqual(err.code, 'MethodNotAllowed');
                    done();
                });
            });
        });

        it(`should ${allow}: GetBucketVersioning`, done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:GetBucketVersioning' }]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => altScalityS3Client.getBucketVersioning(bParam, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: GetBucketWebsite`, done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:GetBucketWebsite' }]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => scalityS3Client.putBucketWebsite(
                    { Bucket: bucket, WebsiteConfiguration: webConfig }, next),
                next => altScalityS3Client.getBucketWebsite(bParam, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: GetLifecycleConfiguration`, done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:GetLifecycleConfiguration' }]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => scalityS3Client.putBucketLifecycleConfiguration(
                    { Bucket: bucket, LifecycleConfiguration: lcConfig }, next),
                next => altScalityS3Client.getBucketLifecycleConfiguration(
                    bParam, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: GetObject`, done => {
            const params = getPolicyParams([
                { key: 'Action', value: 's3:GetObject' },
                { key: 'Resource', value: objArn },
            ]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => scalityS3Client.putObject(oParam, next),
                next => altScalityS3Client.getObject(oParam, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: GetObjectAcl`, done => {
            const params = getPolicyParams([
                { key: 'Action', value: 's3:GetObjectAcl' },
                { key: 'Resource', value: objArn },
            ]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => scalityS3Client.putObject(oParam, next),
                next => altScalityS3Client.getObjectAcl(oParam, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: GetObjectTagging`, done => {
            const params = getPolicyParams([
                { key: 'Action', value: 's3:GetObjectTagging' },
                { key: 'Resource', value: objArn },
            ]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => scalityS3Client.putObject(oParam, next),
                next => altScalityS3Client.getObjectTagging(oParam, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: GetReplicationConfiguration`, done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:GetReplicationConfiguration' }]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => scalityS3Client.putBucketVersioning(
                    { Bucket: bucket, VersioningConfiguration: vConfig }, next),
                next => scalityS3Client.putBucketReplication(
                    { Bucket: bucket, ReplicationConfiguration: repConfig },
                    next),
                next => altScalityS3Client.getBucketReplication(bParam, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: ListBucket`, done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:ListBucket' }]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => altScalityS3Client.headBucket(bParam, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: ListBucketMultipartUploads`, done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:ListBucketMultipartUploads' }]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => altScalityS3Client.listMultipartUploads(bParam, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: ListMultipartUploadParts`, done => {
            const params = getPolicyParams([
                { key: 'Action', value: 's3:ListMultipartUploadParts' },
                { key: 'Resource', value: objArn },
            ]);
            async.waterfall([
                next => scalityS3Client.putBucketPolicy(params, next),
                (policyData, next) => scalityS3Client.createMultipartUpload(
                    { Bucket: bucket, Key: mpuKey }, next),
                (mpuData, next) => {
                    const uId = mpuData.UploadId;
                    altScalityS3Client.listParts(
                        { Bucket: bucket, Key: mpuKey, UploadId: uId },
                        err => next(err, uId));
                },
                (uId, next) => scalityS3Client.abortMultipartUpload(
                    { Bucket: bucket, Key: mpuKey, UploadId: uId }, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: PutBucketAcl`, done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:PutBucketAcl' }]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => altScalityS3Client.putBucketAcl({
                    Bucket: bucket,
                    AccessControlPolicy: {},
                    GrantRead: `uri=${publicId}` }, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: PutBucketCORS`, done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:PutBucketCORS' }]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => altScalityS3Client.putBucketCors(
                    { Bucket: bucket, CORSConfiguration: corsConfig }, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should not ${allow} because bucket owner action: PutBucketPolicy`,
        done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:PutBucketPolicy' }]);
            scalityS3Client.putBucketPolicy(params, err => {
                assert.ifError(err);
                altScalityS3Client.putBucketPolicy(params, err => {
                    assert.strictEqual(err.code, 'MethodNotAllowed');
                    done();
                });
            });
        });

        it(`should ${allow}: PutBucketVersioning`, done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:PutBucketVersioning' }]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => altScalityS3Client.putBucketVersioning(
                    { Bucket: bucket, VersioningConfiguration: vConfig }, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: PutBucketWebsite`, done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:PutBucketWebsite' }]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => altScalityS3Client.putBucketWebsite(
                    { Bucket: bucket, WebsiteConfiguration: webConfig }, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: PutLifecycleConfiguration`, done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:PutLifecycleConfiguration' }]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => altScalityS3Client.putBucketLifecycleConfiguration(
                    { Bucket: bucket, LifecycleConfiguration: lcConfig }, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: PutObject`, done => {
            const params = getPolicyParams([
                { key: 'Action', value: 's3:PutObject' },
                { key: 'Resource', value: objArn },
            ]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => altScalityS3Client.putObject(oParam, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: PutObjectAcl`, done => {
            const params = getPolicyParams([
                { key: 'Action', value: 's3:PutObjectAcl' },
                { key: 'Resource', value: objArn },
            ]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => scalityS3Client.putObject(oParam, next),
                next => altScalityS3Client.putObjectAcl({
                    Bucket: bucket,
                    Key: objKey,
                    AccessControlPolicy: {},
                    GrantRead: `uri=${publicId}` }, next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: PutObjectTagging`, done => {
            const params = getPolicyParams([
                { key: 'Action', value: 's3:PutObjectTagging' },
                { key: 'Resource', value: objArn },
            ]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => scalityS3Client.putObject(oParam, next),
                next => altScalityS3Client.putObjectTagging({
                    Bucket: bucket,
                    Key: objKey,
                    Tagging: { TagSet: [{ Key: 'key', Value: 'value' }] } },
                next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });

        it(`should ${allow}: PutReplicationConfiguration`, done => {
            const params = getPolicyParams(
                [{ key: 'Action', value: 's3:PutReplicationConfiguration' }]);
            async.series([
                next => scalityS3Client.putBucketPolicy(params, next),
                next => scalityS3Client.putBucketVersioning(
                    { Bucket: bucket, VersioningConfiguration: vConfig }, next),
                next => altScalityS3Client.putBucketReplication(
                    { Bucket: bucket, ReplicationConfiguration: repConfig },
                    next),
            ], err => {
                assert.ifError(err);
                done();
            });
        });
    });
});

describe('Bucket policies with basic policies', () => {
    before(done => {
        scalityS3Client.createBucket({
            Bucket: bucket,
            CreateBucketConfiguration: { LocationConstraint: 'us-east-1' } },
        done);
    });

    it(`should ${allow}: DeleteBucket`, done => {
        const params = getPolicyParams(
            [{ key: 'Action', value: 's3:DeleteBucket' }]);
        async.series([
            next => scalityS3Client.putBucketPolicy(params, err => {
                assert.ifError(err);
                next();
            }),
            next => altScalityS3Client.deleteBucket(bParam, err => {
                assert.ifError(err);
                next();
            }),
        ], err => {
            assert.ifError(err);
            scalityS3Client.createBucket(bParam, done);
        });
    });
});
