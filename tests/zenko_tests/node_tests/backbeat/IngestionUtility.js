const assert = require('assert');
const async = require('async');
const crypto = require('crypto');

const { scalityS3Client, ringS3Client } = require('../s3SDK');
const ReplicationUtility = require('./ReplicationUtility');

class IngestionUtility extends ReplicationUtility {
    constructor(s3, ringS3C) {
        super(s3);
        this.ringS3C = ringS3C;
    }

    putObjectTagging(bucketName, key, versionId, cb) {
        this.s3.putObjectTagging({
            Bucket: bucketName,
            Key: key,
            VersionId: versionId,
            Tagging: {
                TagSet: [
                    {
                        Key: 'object-tag-key',
                        Value: 'object-tag-value',
                    },
                ],
            },
        }, (err, data) => {
            console.log('putObjectTagging', bucketName, key, data);
            return cb(err, data);
        });
    }

    getSourceObject(bucketName, objName, cb) {
        this.ringS3C.getObject({
            Bucket: bucketName,
            Key: objName,
        }, (err, data) => {
            console.log('getting source object', bucketName, objName, err);
            return cb(err, data);
        });
    }

    getDestObject(bucketName, objName, cb) {
        this.s3.getObject({
            Bucket: bucketName,
            Key: objName,
        }, (err, data) => {
            console.log('getting dest object', bucketName, objName);
            return cb(err, data);
        });
    }

    createIngestionBucket(bucketName, ingestionSrcLocation, cb) {
        console.log('creating ingestion bucket', bucketName, ingestionSrcLocation);
        async.series([
            next => this.s3.createBucket({
                Bucket: bucketName,
                CreateBucketConfiguration: {
                    LocationConstraint: `${ingestionSrcLocation}:ingest`,
                },
            }, next),
            next => this.s3.putBucketVersioning({
                Bucket: bucketName,
                VersioningConfiguration: {
                    Status: 'Enabled',
                },
            }, next),
        ], cb);
    }

    waitUntilIngested(bucketName, key, versionId, cb) {
        console.log('getting object', bucketName, key, versionId);
        let ingested = false;
        const expectedCode = 'NoSuchKey';
        return async.doWhilst(callback =>
            this.s3.getObject({
                Bucket: bucketName,
                Key: key,
            }, (err, data) => {
                if (err && err.code !== expectedCode) {
                    return callback(err);
                }
                ingested = err && err.code === expectedCode;
                if (!ingested) {
                    console.log('not ingested, trying again')
                    return setTimeout(callback, 2000);
                }
                return callback();
            }),
        () => !ingested, cb);
    }

    waitUntilDeleted(bucketName, key, cb) {
        console.log('waiting for deletion', bucketName, key);
        let objectExists;
        const expectedCode = 'NoSuchKey';
        return async.doWhilst(callback =>
            this.s3.getObject({
                Buckekt: bucketName,
                Key: key,
            }, err => {
                if (err && err.code !== expectedCode) {
                    return callback(err);
                }
                objectExists = err === null;
                if (!objectExists) {
                    return callback();
                }
                return setTimeout(callback, 2000);
            }),
        () => objectExists, cb);
    }

    compareObjectsRINGS3C(srcBucket, destBucket, key, cb) {
        return async.series([
            next => this.waitUntilIngested(destBucket, key, undefined,
                next),
            next => this.getSourceObject(srcBucket, key, next),
            next => this.getDestObject(destBucket, key, next),
        ], (err, data) => {
            if (err) {
                return cb(err);
            }
            const srcData = data[1];
            const destData = data[2];
            assert.strictEqual(srcData.ContentLength,
                destData.ContentLength);
            this._compareObjectBody(srcData.Body, destData.Body);
            assert.deepStrictEqual(srcData.Metadata, destData.Metadata);
            assert.strictEqual(srcData.ETag, destData.ETag);
            assert.strictEqual(srcData.WebsiteRedirectLocation,
                destData.WebsiteRedirectLocation);
            assert.strictEqual(srcData.ContentType, destData.ContentType);
            assert.strictEqual(srcData.VersionId, destData.VersionId);
            // TODO: should LastModified be equal?
            return cb();
        });
    }
    //
    // compareObjectTagsRINGS3C(srcBucket, destBucket, key, zenkoVersionId,
    //     s3cVersionId, cb) {
    //     return async.series([
    //         next => this.waitUntilIngested(srcBucket, key, zenkoVersionId, next),
    //         next => this.
    //     ])
    // }
}

module.exports = IngestionUtility;
