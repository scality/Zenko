const assert = require('assert');
const async = require('async');

const { scalityS3Client, ringS3Client } = require('../s3SDK');
const ReplicationUtility = require('./ReplicationUtility');
const BackbeatAPIUtility = require('./BackbeatAPIUtility');

const backbeatAPIUtils = new BackbeatAPIUtility();

class IngestionUtility extends ReplicationUtility {
    constructor(s3, ringS3C) {
        super(s3);
        this.ringS3C = ringS3C;
    }

    getSourceObject(bucketName, objName, versionId, cb) {
        this.ringS3C.getObject({
            Bucket: bucketName,
            Key: objName,
            VersionId: versionId,
        }, cb);
    }

    getDestObject(bucketName, objName, versionId, cb) {
        this.s3.getObject({
            Bucket: bucketName,
            Key: objName,
            VersionId: versionId,
        }, cb);
    }

    createIngestionBucket(bucketName, locationName, cb) {
        const locationNameWithSuffix = `${locationName}:ingest`;
        return this.s3.createBucket({
            Bucket: bucketName,
            CreateBucketConfiguration: {
                LocationConstraint: locationNameWithSuffix,
            },
        }, err => {
            if (err) {
                return cb(err);
            }
            // When resuming an ingestion-enabled location,
            // backbeat gets the list of buckets with ingestion-enabled
            // to check if the location is valid.
            // Backbeat sets the list of buckets with ingestion-enabled periodically,
            // so the list might be outdated for few seconds leading to a 404 API error response.
            // Also backbeat "ingestion producer" process applies update every 5 seconds.
            // For this reason, we are waiting 10 seconds to make sure ingestion processes are up-to-date.
            return setTimeout(() => backbeatAPIUtils.resumeIngestion(locationName, false, null, (err, body) => {
                if (err) {
                    return cb(err);
                }
                if (body.code) {
                    return cb(`error resuming ingestion: ${JSON.stringify(body)}`);
                }
                return cb();
            }), 10000);
        });
    }

    putObjectWithProperties(bucketName, objectName, content, cb) {
        this.s3.putObject({
            Bucket: bucketName,
            Key: objectName,
            ContentType: 'image/png',
            CacheControl: 'test-cache-control',
            ContentDisposition: 'test-content-disposition',
            ContentEncoding: 'ascii',
            Body: content,
        }, cb);
    }

    waitUntilIngested(bucketName, key, versionId, cb) {
        let status;
        const expectedCode = 'NotFound';
        return async.doWhilst(
            callback => this.s3.headObject({
                Bucket: bucketName,
                Key: key,
                VersionId: versionId,
            }, err => {
                if (err && err.code !== expectedCode) {
                    return callback(err);
                }
                status = !err;
                if (!status) {
                    return setTimeout(callback, 2000);
                }
                return callback();
            }),
            () => !status,
            cb,
        );
    }

    waitUntilTagsIngested(bucketName, key, versionId, cb) {
        let tagsExist;
        return async.doWhilst(
            callback => this.getObjectTagging(bucketName, key, versionId, (err, data) => {
                if (err) {
                    return callback(err);
                }
                tagsExist = data.TagSet.length > 0;
                if (tagsExist) {
                    return callback();
                }
                return setTimeout(callback, 2000);
            }),
            () => !tagsExist,
            cb,
        );
    }

    waitUntilEmpty(bucketName, cb) {
        let objectsEmpty;
        return async.doWhilst(
            callback => this.s3.listObjectVersions({ Bucket: bucketName }, (err, data) => {
                if (err) {
                    return cb(err);
                }
                const versionLength = data.Versions.length;
                const deleteLength = data.DeleteMarkers.length;
                objectsEmpty = (versionLength + deleteLength) === 0;
                if (objectsEmpty) {
                    return callback();
                }
                return setTimeout(callback, 2000);
            }),
            () => !objectsEmpty,
            cb,
        );
    }

    compareObjectsRINGS3C(srcBucket, destBucket, key, versionId, optionalFields, cb) {
        return async.series([
            next => this.waitUntilIngested(
                destBucket,
                key,
                versionId,
                next,
            ),
            next => this.getSourceObject(srcBucket, key, versionId, next),
            next => this.getDestObject(destBucket, key, versionId, next),
        ], (err, data) => {
            if (err) {
                return cb(err);
            }
            const srcData = data[1];
            const destData = data[2];
            assert.strictEqual(
                srcData.ContentLength,
                destData.ContentLength,
            );
            this._compareObjectBody(srcData.Body, destData.Body);
            assert.deepStrictEqual(srcData.Metadata, destData.Metadata);
            assert.strictEqual(srcData.ETag, destData.ETag);
            assert.strictEqual(srcData.ContentType, destData.ContentType);
            assert.strictEqual(srcData.VersionId, destData.VersionId);
            assert.strictEqual(
                srcData.LastModified.toString(),
                destData.LastModified.toString(),
            );
            if (optionalFields) {
                optionalFields.forEach(field => {
                    if (field === 'Metadata') {
                        assert.strictEqual(srcData.customKey, destData.customKey);
                    } else {
                        assert.strictEqual(srcData[field], destData[field]);
                    }
                });
            }
            return cb();
        });
    }

    compareObjectTagsRINGS3C(srcBucket, destBucket, key, versionId, cb) {
        return async.series([
            next => this.waitUntilTagsIngested(destBucket, key, versionId, next),
            next => this._setS3Client(ringS3Client).getObjectTagging(
                srcBucket,
                key,
                versionId,
                next,
            ),
            next => this._setS3Client(scalityS3Client).getObjectTagging(
                destBucket,
                key,
                versionId,
                next,
            ),
        ], (err, data) => {
            if (err) {
                return cb(err);
            }
            const srcData = data[1];
            const destData = data[2];
            assert.deepStrictEqual(srcData.TagSet, destData.TagSet);
            assert.strictEqual(srcData.VersionId, destData.VersionId);
            return cb();
        });
    }
}

module.exports = IngestionUtility;
