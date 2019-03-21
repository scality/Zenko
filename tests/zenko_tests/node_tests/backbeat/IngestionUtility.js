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
        }, cb);
    }

    getSourceObject(bucketName, objName, cb) {
        this.ringS3C.getObject({
            Bucket: bucketName,
            Key: objName,
        }, cb);
    }

    getDestObject(bucketName, objName, cb) {
        this.s3.getObject({
            Bucket: bucketName,
            Key: objName,
        }, cb);
    }

    createIngestionBucket(bucketName, ingestionSrcLocation, cb) {
        this.s3.createBucket({
            Bucket: bucketName,
            CreateBucketConfiguration: {
                LocationConstraint: `${ingestionSrcLocation}:ingest`,
            },
        }, cb);
    }

    waitUntilIngested(bucketName, key, versionId, cb) {
        let status;
        const expectedCode = 'NoSuchKey';
        return async.doWhilst(callback =>
            this.s3.getObject({
                Bucket: bucketName,
                Key: key,
            }, (err, data) => {
                if (err && err.code !== expectedCode) {
                    return callback(err);
                }
                status = !err;
                if (!status) {
                    return setTimeout(callback, 2000);
                }
                return callback();
            }),
        () => !status, cb);
    }

    waitUntilEmpty(bucketName, cb) {
        let objectsEmpty;
        return async.doWhilst(callback =>
            this.s3.listObjectVersions({ Bucket: bucketName }, (err, data) => {
                if (err) {
                    return cb(err);
                }
                let versionLength = data.Versions.length;
                let deleteLength = data.DeleteMarkers.length;
                objectsEmpty = (versionLength + deleteLength) === 0;
                if (objectsEmpty) {
                    return callback();
                }
                return setTimeout(callback, 2000);
            }),
        () => !objectsEmpty, cb);
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
            assert.strictEqual(srcData.ContentType, destData.ContentType);
            assert.strictEqual(srcData.VersionId, destData.VersionId);
            assert.strictEqual(srcData.LastModified.toString(),
                destData.LastModified.toString());
            if (srcData.WebsiteRedirectLocation) {
                assert.strictEqual(srcData.WebsiteRedirectLocation,
                    destData.WebsiteRedirectLocation);
            }
            return cb();
        });
    }

    compareObjectTagsRINGS3C(srcBucket, destBucket, key, zenkoVersionId,
        s3cVersionId, cb) {
        return async.series([
            next => this.waitUntilIngested(srcBucket, key, zenkoVersionId, next),
            next => this._setS3Client(this.ringS3C).getObjectTagging(srcBucket,
                key, zenkoVersionId, next),
            next => this._setS3Client(this.s3).getObjectTagging(destBucket, key,
                zenkoVersionId, next),
        ], (err, data) => {
            if (err) {
                return cb(err);
            }
            const srcData = data[1];
            const destData = data[2];
            assert.deepStrictEqual(srcData.TagSet, destData.TagSet);
            return cb();
        });
    }
}

module.exports = IngestionUtility;
