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
        console.log('delete versionList', cb);
        async.each(versionList, (versionInfo, next) =>
            this.deleteObject(bucketName, versionInfo.Key,
                versionInfo.VersionId, next), cb);
    }

    putObject(bucketName, objectName, content, cb) {
        console.log('putting object');
        this.s3.putObject({
            Bucket: bucketName,
            Key: objectName,
            Body: content,
        }, cb);
    }

    deleteObject(bucketName, key, versionId, cb) {
        console.log('deleting  object', cb);
        this.s3.deleteObject({
            Bucket: bucketName,
            Key: key,
            VersionId: versionId,
        }, cb);
    }

    getSourceObject(bucketName, objName, cb) {
        console.log('getting source object');
        this.ringS3C.getObject({
            Bucket: bucketName,
            Key: objName,
        }, cb);
    }

    getDestObject(bucketName, objName, cb) {
        console.log('getting dest object');
        this.s3.getObject({
            Bucket: bucketName,
            Key: objName,
        }, cb);
    }

    createIngestionBucket(bucketName, ingestionSrcLocation, cb) {
        console.log('creating ingestion bucket', cb);
        async.waterfall([
            next => this.s3.createBucket({
                Bucket: bucketName,
                CreateBucketConfiguration: {
                    LocationConstraint: `${ingestionSrcLocation}:ingest`,
                },
            }, (err,  data) => {
                console.log('next createBucket', next);
                return next(err, data);
            }),
            next => this.s3.putBucketVersioning({
                Bucket: bucketName,
                VersioningConfiguration: {
                    Status: 'Enabled',
                },
            }, (err, data) => {
                console.log('next put versioning', next);
                return next(err, data);
            }),
        ], err => {
            console.log('cb i s', cb);
            return cb(err);
        });
    }

    waitUntilIngested(bucketName, key, versionId, cb) {
        console.log('getting object');
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
        console.log('waiting for deletion');
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
            console.log('list  object versions');
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

    deleteVersionedBucket(bucketName, cb) {
        return async.series([
            next => this.deleteAllVersions(bucketName, undefined, next),
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
}

module.exports = IngestionUtility;
