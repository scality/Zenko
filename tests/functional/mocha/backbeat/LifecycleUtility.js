const async = require('async');

const {
    CreateBucketCommand,
    CreateMultipartUploadCommand,
    DeleteBucketCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsCommand,
    ListObjectVersionsCommand,
    ListMultipartUploadsCommand,
    PutBucketLifecycleConfigurationCommand,
    PutBucketVersioningCommand,
    PutObjectLegalHoldCommand,
    PutObjectLockConfigurationCommand,
    RestoreObjectCommand,
} = require('@aws-sdk/client-s3');
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
        this.s3.send(new CreateBucketCommand({
            Bucket: bucket,
            CreateBucketConfiguration: {
                LocationConstraint: this.sourceLocation,
            },
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    createVersionedBucket(bucket, cb) {
        return async.series([
            next => this.createBucket(bucket, next),
            next => this.s3.send(new PutBucketVersioningCommand({
                Bucket: bucket,
                VersioningConfiguration: {
                    Status: 'Enabled',
                },
            }))
                .then(() => next())
                .catch(next),
        ], cb);
    }

    deleteVersionedBucket(bucketName, cb) {
        return async.series([
            next => this.deleteAllVersions(bucketName, undefined, next),
            next => this.s3.send(new DeleteBucketCommand({ Bucket: bucketName }))
                .then(() => next())
                .catch(cb),
        ], cb);
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
                (info, next) => this.s3.send(new PutObjectLegalHoldCommand({
                    Bucket: bucket,
                    Key: key,
                    LegalHold: { Status: 'ON' },
                    VersionId: info.VersionId,
                }))
                    .then(data => next(null, data))
                    .catch(cb),
            ], tdone), done);
        }, cb);
    }


    getObject(versionId, cb) {
        const params = {
            Bucket: this.bucket,
            Key: this.key,
        };
        if (versionId) {
            params.VersionId = versionId;
        }
        this.s3.send(new GetObjectCommand(params))
            .then(async (data) => {
                if (data.Body) {
                    const chunks = [];
                    // eslint-disable-next-line no-restricted-syntax
                    for await (const chunk of data.Body) {
                        chunks.push(chunk);
                    }
                    data.Body = Buffer.concat(chunks);
                }
                cb(null, data);
            })
            .catch(cb);
    }

    deleteObject(bucket, key, versionId, cb) {
        this.s3.send(new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
            VersionId: versionId,
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    createMultipartUpload(bucket, key, cb) {
        this.s3.send(new CreateMultipartUploadCommand({
            Bucket: bucket,
            Key: key,
        }))
            .then(data => cb(null, data))
            .catch(cb);
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

    putBucketVersioningConfiguration(status, cb) {
        this.s3.send(new PutBucketVersioningCommand({
            Bucket: this.bucket,
            VersioningConfiguration: {
                Status: status,
            },
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    putBucketLifecycleConfiguration(transitionDate, cb) {
        const lifecycleConfig = {
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
        };

        this.s3.send(new PutBucketLifecycleConfigurationCommand(lifecycleConfig))
            .then(data => cb(null, data))
            .catch(cb);
    }

    /**
     * Put NonCurrentVersion Transition bucket lifecycle configuration
     *
     * @param {function} cb - callback function
     *
     * @returns {undefined} undefined
     */
    putBucketNCVTLifecycleConfiguration(cb) {
        this.s3.send(new PutBucketLifecycleConfigurationCommand({
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
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    putBucketExpiration(bucket, rules, cb) {
        this.s3.send(new PutBucketLifecycleConfigurationCommand({
            Bucket: bucket,
            LifecycleConfiguration: { Rules: rules },
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    waitUntilTransitioned(versionId, cb) {
        let shouldContinue;
        const params = {
            Bucket: this.bucket,
            Key: this.key,
        };
        if (versionId) {
            params.VersionId = versionId;
        }
        return async.doWhilst(
            next => this.s3.send(new HeadObjectCommand(params))
                .then(data => {
                    shouldContinue = data.StorageClass !== this.destinationLocation;
                    if (shouldContinue) {
                        return setTimeout(next, 5000);
                    }
                    return next();
                })
                .catch(cb),
            () => shouldContinue,
            cb,
        );
    }

    putObjectLockConfiguration(bucket, mode, cb) {
        if (!mode) {
            return process.nextTick(cb);
        }

        return this.s3.send(new PutObjectLockConfigurationCommand({
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
        }))
            .then(data => cb(null, data))
            .catch(cb);
    }

    createObjectLockedBucket(bucket, mode, cb) {
        return async.series([
            next => this.s3.send(new CreateBucketCommand({
                Bucket: bucket,
                ObjectLockEnabledForBucket: true,
            }))
                .then(() => next())
                .catch(cb),
            next => this.putObjectLockConfiguration(bucket, mode, next),
        ], cb);
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
        this.s3.send(new ListObjectsCommand({ Bucket: bucket }))
            .then(res => {
                const contents = res.Contents || [];
                if (typeof count === 'number') {
                    return cb(null, contents.length === count);
                }
                return cb(null, contents.length > 0);
            })
            .catch(cb);
    }

    hasDeleteMarkers(bucket, count, cb) {
        this.s3.send(new ListObjectVersionsCommand({ Bucket: bucket }))
            .then(res => {
                const deleteMarkers = res.DeleteMarkers || [];
                if (typeof count === 'number') {
                    return cb(null, deleteMarkers.length === count);
                }
                return cb(null, deleteMarkers.length > 0);
            })
            .catch(cb);
    }

    hasVersionedObjects(bucket, count, cb) {
        this.s3.send(new ListObjectVersionsCommand({ Bucket: bucket }))
            .then(res => {
                const versions = res.Versions || [];
                if (typeof count === 'number') {
                    return cb(null, versions.length === count);
                }
                return cb(null, versions.length > 0);
            })
            .catch(cb);
    }

    hasIncompleteMPUs(bucket, count, cb) {
        this.s3.send(new ListMultipartUploadsCommand({ Bucket: bucket }))
            .then(res => {
                const uploads = res.Uploads || [];
                if (typeof count === 'number') {
                    return cb(null, uploads.length === count);
                }
                return cb(null, uploads.length > 0);
            })
            .catch(cb);
    }

    /**
     * Put an object restore request
     *
     * @param {string} [versionId] - version id of an object
     * @param {function} cb - callback function
     *
     * @returns {undefined} undefined
     */
    putRestoreObject(versionId, cb) {
        const params = {
            Bucket: this.bucket,
            Key: this.key,
            RestoreRequest: {
                Days: 1,
                Tier: 'Standard',
            },
        };
        if (versionId) {
            params.VersionId = versionId;
        }
        this.s3.send(new RestoreObjectCommand(params))
            .then(data => cb(null, data))
            .catch(cb);
    }

    /**
     * Wait until an archived object is restored
     *
     * @param {string} [versionId] - version id of an object
     * @param {function} cb - callback function
     *
     * @returns {undefined} undefined
     */
    waitUntilRestored(versionId, cb) {
        let shouldContinue;
        const params = {
            Bucket: this.bucket,
            Key: this.key,
        };
        if (versionId) {
            params.VersionId = versionId;
        }
        return async.doWhilst(
            next => this.s3.send(new HeadObjectCommand(params))
                .then(data => {
                    shouldContinue = data.Restore?.includes('ongoing-request="false", expiry-date=');
                    if (shouldContinue) {
                        return setTimeout(next, 5000);
                    }
                    return next();
                })
                .catch(next),
            () => shouldContinue,
            cb,
        );
    }
}

module.exports = LifecycleUtility;
