const assert = require('assert');

const uuidV4 = require('uuid/v4');
const async = require('async');

const s3 = require('./s3SDK').scalityS3Client;

const bucket = `get-bucket-${uuidV4()}`;
const key = `object-key-${uuidV4()}`;
const body = 'testbody';

describe('Test Configuration', () => {
    it('should create a bucket and upload an object', done => {
        async.series([
            next => s3.createBucket({
                Bucket: bucket,
                CreateBucketConfiguration: {
                    LocationConstraint: 'us-east-1',
                },
            }, next),
            next => s3.listBuckets((err, res) => {
                assert.ifError(err);
                assert.strictEqual(res.Buckets.length, 1);
                assert.strictEqual(res.Buckets[0].Name, bucket);
                next();
            }),
            next => s3.putObject({
                Bucket: bucket, Key: key, Body: body,
            }, next),
            next => s3.getObject(
                { Bucket: bucket, Key: key },
                (err, res) => {
                    assert.ifError(err);
                    assert.strictEqual(body, res.Body.toString());
                    next();
                },
            ),
            next => s3.listObjects({ Bucket: bucket }, (err, res) => {
                assert.ifError(err);
                assert.strictEqual(res.Contents.length, 1);
                assert.strictEqual(res.Contents[0].Key, key);
                next();
            }),
            next => s3.deleteObject({ Bucket: bucket, Key: key }, next),
            next => s3.deleteBucket({ Bucket: bucket }, next),
        ], done);
    });
});

