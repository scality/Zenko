const assert = require('assert');
const async = require('async');
const crypto = require('crypto');

const { scalityS3Client, ringS3Client } = require('../s3SDK');

class IngestionUtility {
    constructor(s3, ringS3C) {
        this.s3 = s3;
        this.ringS3C = ringS3C;
    }

    _compareObjectBody(body1, body2) {
        const digest1 = crypto.createHash('md5').update(body1).digest('hex');
        const digest2 = crypto.createHash('md5').update(body2).digest('hex');
        assert.strictEqual(digest1, digest2);
    }


    _deleteVersionList(versionList, bucketName, cb) {
        async.each(versionList, (versionInfo, next) => {
            return this.deleteObject(bucketName, versionInfo.Key,
                versionInfo.VersionId, next), (err, data) => {
                    console.log('err deleting versionList', err);
                    return next(err, data);
                };
        }, cb);
    }

    putObject(bucketName, objectName, content, cb) {
        this.s3.putObject({
            Bucket: bucketName,
            Key: objectName,
            Body: content,
        }, (err, data) => {
            console.log('putting object', bucketName, objectName, err);
            return cb(err, data);
        });
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

    deleteObject(bucketName, key, versionId, cb) {
        this.s3.deleteObject({
            Bucket: bucketName,
            Key: key,
            VersionId: versionId,
        }, (err, data) => {
            console.log('deleting  object', bucketName, key, versionId, err);
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
                status = err === null;
                if (!status) {
                    return setTimeout(callback, 2000);
                }
                return callback();
            }),
        () => !status, cb);
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

    deleteAllVersions(bucketName, keyPrefix, cb) {
        this.s3.listObjectVersions({ Bucket: bucketName }, (err, data) => {
            console.log('list object versions', bucketName, keyPrefix, err);
            if (err) {
                return cb(err);
            }
            let versions = data.Versions;
            let deleteMarkers = data.DeleteMarkers;
            // If replicating to a multiple backend bucket, we only want to
            // remove versions that we have put with our tests.
            if (keyPrefix) {
                versions = versions.filter(version =>
                    version.Key.startsWith(keyPrefix));
                deleteMarkers = deleteMarkers.filter(marker =>
                    marker.Key.startsWith(keyPrefix));
            }
            return async.series([
                next => this._deleteVersionList(deleteMarkers, bucketName,
                    next),
                next => this._deleteVersionList(versions, bucketName, next),
            ], err => cb(err));
        });
    }

    deleteVersionedBucket(bucketName, keyPrefix, cb) {
        console.log('deleting versioned  bucket', bucketName);
        return async.series([
            next => this.deleteAllVersions(bucketName, keyPrefix, next),
            next => this.s3.deleteBucket({ Bucket: bucketName }, next),
        ], err => cb(err));
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
