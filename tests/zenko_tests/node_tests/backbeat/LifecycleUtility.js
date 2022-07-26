const async = require('async');

const ReplicationUtility = require('./ReplicationUtility');

const BUCKET_CHECK_TIMEOUT_S = process.env.BACKBEAT_BUCKET_CHECK_TIMEOUT_S
    ? parseInt(process.env.BACKBEAT_BUCKET_CHECK_TIMEOUT_S, 10)
    : 60;

class LifecycleUtility extends ReplicationUtility {
    setBucket(bucket) {
        this.bucket = bucket;
        return this;
    }

    setKey(key) {
        this.key = key;
        return this;
    }

    setKeyPrefix(keyPrefix) {
        this.keyPrefix = keyPrefix;
        return this;
    }

    setSourceLocation(sourceLocation) {
        this.sourceLocation = sourceLocation;
        return this;
    }

    setDestinationLocation(destinationLocation) {
        this.destinationLocation = destinationLocation;
        return this;
    }

    setLocationType(locType) {
        this.locationType = locType;
        return this;
    }

    createBucket(bucket, cb) {
        this.s3.createBucket({
            Bucket: bucket,
            CreateBucketConfiguration: {
                LocationConstraint: this.sourceLocation,
            },
        }, cb);
    }

    createVersionedBucket(bucket, cb) {
        return async.series([
            next => this.createBucket(bucket, next),
            next => this.s3.putBucketVersioning({
                Bucket: bucket,
                VersioningConfiguration: {
                    Status: 'Enabled',
                },
            }, next),
        ], err => cb(err));
    }

    deleteVersionedBucket(bucketName, cb) {
        return async.series([
            next => this.deleteAllVersions(bucketName, undefined, next),
            next => this.s3.deleteBucket({ Bucket: bucketName }, next),
        ], err => cb(err));
    }

    putObject(data, cb) {
        super.putObject(this.bucket, this.key, data, cb);
    }

    putObjects(bucket, keys, count, cb) {
        async.forEachSeries(keys, (key, done) => {
            async.timesLimit(count, 10, (n, tdone) => super.putObject(bucket, key, Buffer.alloc(1024), tdone), done);
        }, cb);
    }

    putObjectsWithTagging(bucket, keys, count, cb) {
        async.forEachSeries(keys, (key, done) => {
            async.timesLimit(count, 10, (n, tdone) => async.waterfall([
                next => super.putObject(bucket, key, Buffer.alloc(1024), next),
                (info, next) => this.putObjectTagging(bucket, key, info.VersionId, next),
            ], tdone), done);
        }, cb);
    }

    putObjectsWithLegalHold(bucket, keys, count, cb) {
        async.forEachSeries(keys, (key, done) => {
            async.timesLimit(count, 10, (n, tdone) => async.waterfall([
                next => super.putObject(bucket, key, Buffer.alloc(1024), next),
                (info, next) => this.s3.putObjectLegalHold({
                    Bucket: bucket,
                    Key: key,
                    LegalHold: { Status: 'ON' },
                    VersionId: info.VersionId,
                }, next),
            ], tdone), done);
        }, cb);
    }


    getObject(cb) {
        super.getObject(this.bucket, this.key, cb);
    }

    deleteObject(bucket, key, versionId, cb) {
        this.s3.deleteObject({
            Bucket: bucket,
            Key: key,
            VersionId: versionId,
        }, cb);
    }

    createMultipartUpload(bucket, key, cb) {
        this.s3.createMultipartUpload({
            Bucket: bucket,
            Key: key,
        }, cb);
    }

    putMPU(howManyParts, cb) {
        super.completeMPUAWS(this.bucket, this.key, howManyParts, cb);
    }

    getObjectDataFromLocation(cb) {
        switch (this.locationType) {
        case 'AWS':
            super.getObject(this.bucket, this.key, (err, data) => {
                if (err) {
                    return cb(err);
                }
                return cb(null, data.Body);
            });
            break;
        case 'GCP':
            super.download(this.bucket, this.key, (err, data) => {
                if (err) {
                    return cb(err);
                }
                // GCP returns [] for an empty object for some reason
                if (Array.isArray(data) && data.length === 0) {
                    return cb(null, Buffer.alloc(0));
                }
                return cb(null, data);
            });
            break;
        case 'Azure':
            super.getBlob(this.bucket, this.key, cb);
            break;
        default:
            cb(new Error(`bad destination location type ${this.locationType}`));
        }
    }

    clearBucket(cb) {
        switch (this.locationType) {
        case 'AWS':
            this.deleteAllVersions(this.bucket, this.keyPrefix, cb);
            break;
        case 'GCP':
            this.deleteAllFiles(this.bucket, this.keyPrefix, cb);
            break;
        case 'Azure':
            super.deleteAllBlobs(this.bucket, this.keyPrefix, cb);
            break;
        default:
            cb(new Error(`bad destination location type ${this.locationType}`));
        }
    }

    putBucketLifecycleConfiguration(transitionDate, cb) {
        this.s3.putBucketLifecycleConfiguration({
            Bucket: this.bucket,
            LifecycleConfiguration: {
                Rules: [{
                    Status: 'Enabled',
                    Prefix: this.keyPrefix,
                    Transitions: [
                        {
                            Date: transitionDate,
                            StorageClass: this.destinationLocation,
                        },
                    ],
                }],
            },
        }, cb);
    }

    /**
     * Put NonCurrentVersion Transition bucket lifecycle configuration
     *
     * @param {function} cb - callback function
     *
     * @returns {undefined} undefined
     */
    putBucketNCVTLifecycleConfiguration(cb) {
        this.s3.putBucketLifecycleConfiguration({
            Bucket: this.bucket,
            LifecycleConfiguration: {
                Rules: [{
                    Status: 'Enabled',
                    Prefix: this.keyPrefix,
                    NoncurrentVersionTransitions: [
                        {
                            NoncurrentDays: 1,
                            StorageClass: this.destinationLocation,
                        },
                    ],
                }],
            },
        }, cb);
    }

    putBucketExpiration(bucket, rules, cb) {
        this.s3.putBucketLifecycleConfiguration({
            Bucket: bucket,
            LifecycleConfiguration: { Rules: rules },
        }, cb);
    }

    waitUntilTransitioned(version, cb) {
        let shouldContinue;
        const params = {
            Bucket: this.bucket,
            Key: this.key,
        };
        if (version) {
            params.VersionId = version;
        }
        return async.doWhilst(
            next => this.s3.headObject(params, (err, data) => {
                if (err) {
                    return next(err);
                }
                shouldContinue = data.StorageClass !== this.destinationLocation;
                if (shouldContinue) {
                    return setTimeout(next, 5000);
                }
                return next();
            }),
            () => shouldContinue,
            cb,
        );
    }

    putObjectLockConfiguration(bucket, mode, cb) {
        if (!mode) {
            return process.nextTick(cb);
        }

        return this.s3.putObjectLockConfiguration({
            Bucket: bucket,
            ObjectLockConfiguration: {
                ObjectLockEnabled: 'Enabled',
                Rule: {
                    DefaultRetention: {
                        Years: 1,
                        Mode: mode,
                    },
                },
            },
        }, cb);
    }

    createObjectLockedBucket(bucket, mode, cb) {
        return async.series([
            next => this.s3.createBucket({
                Bucket: bucket,
                ObjectLockEnabledForBucket: true,
            }, next),
            next => this.putObjectLockConfiguration(bucket, mode, next),
        ], err => cb(err));
    }

    waitUntilBucketState(bucket, expectedState, cb) {
        const [
            contentSize,
            versionedSize,
            delMarkerSize,
            mpuSize,
        ] = expectedState;

        let hasPassed = false;

        return async.whilst(
            () => !hasPassed,
            (done) => async.series([
                next => this.hasObjects(bucket, contentSize, next),
                next => this.hasDeleteMarkers(bucket, delMarkerSize, next),
                next => this.hasVersionedObjects(bucket, versionedSize, next),
                next => this.hasIncompleteMPUs(bucket, mpuSize, next),
            ], (err, res) => {
                if (err) {
                    return done(err);
                }

                hasPassed = res.every(v => v);
                return setTimeout(() => done(), BUCKET_CHECK_TIMEOUT_S * 1000);
            }),
            cb,
        );

    }

    hasObjects(bucket, count, cb) {
        this.s3.listObjects({ Bucket: bucket }, (err, res) => {
            if (err) {
                return cb(err);
            }
            if (typeof count === 'number') {
                return cb(null, res.Contents.length === count);
            }
            return cb(null, res.Contents.length > 0);
        });
    }

    hasDeleteMarkers(bucket, count, cb) {
        this.s3.listObjectVersions({ Bucket: bucket }, (err, res) => {
            if (err) {
                return cb(err);
            }
            if (typeof count === 'number') {
                return cb(null, res.DeleteMarkers.length === count);
            }
            return cb(null, res.DeleteMarkers.length > 0);
        });
    }

    hasVersionedObjects(bucket, count, cb) {
        this.s3.listObjectVersions({ Bucket: bucket }, (err, res) => {
            if (err) {
                return cb(err);
            }
            if (typeof count === 'number') {
                return cb(null, res.Versions.length === count);
            }
            return cb(null, res.Versions.length > 0);
        });
    }

    hasIncompleteMPUs(bucket, count, cb) {
        this.s3.listMultipartUploads({ Bucket: bucket }, (err, res) => {
            if (err) {
                return cb(err);
            }
            if (typeof count === 'number') {
                return cb(null, res.Uploads.length === count);
            }
            return cb(null, res.Uploads.length > 0);
        });
    }
}

module.exports = LifecycleUtility;
