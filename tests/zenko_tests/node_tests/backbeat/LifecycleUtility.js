const async = require('async');

const ReplicationUtility = require('./ReplicationUtility');

class LifecycleUtility extends ReplicationUtility {
    constructor(s3, azure, gcpStorage) {
        super(s3, azure, gcpStorage);
    }

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

    createBucket(cb) {
        this.s3.createBucket({
            Bucket: this.bucket,
            CreateBucketConfiguration: {
                LocationConstraint: this.sourceLocation,
            },
        }, cb);
    }

    createVersionedBucket(cb) {
        return async.series([
            next => this.createBucket(next),
            next => this.s3.putBucketVersioning({
                Bucket: this.bucket,
                VersioningConfiguration: {
                    Status: 'Enabled',
                }
            }, next),
        ], err => cb(err));
    }

    putObject(data, cb) {
        super.putObject(this.bucket, this.key, data, cb);
    }

    getObject(cb) {
        super.getObject(this.bucket, this.key, cb);
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
            break ;
        case 'GCP':
            super.download(this.bucket, this.key, (err, data) => {
                if (err) {
                    return cb(err);
                }
                // GCP returns [] for an empty object for some reason
                if (Array.isArray(data) && data.length === 0) {
                    return cb(null, new Buffer(0));
                }
                return cb(null, data);
            });
            break ;
        case 'Azure':
            super.getBlob(this.bucket, this.key, cb);
            break ;
        default:
            cb(new Error(`bad destination location type ${this.locationType}`));
        }
    }

    clearBucket(cb) {
        switch (this.locationType) {
        case 'AWS':
            this.deleteAllVersions(this.bucket, this.keyPrefix, cb);
            break ;
        case 'GCP':
            this.deleteAllFiles(this.bucket, this.keyPrefix, cb);
            break ;
        case 'Azure':
            super.deleteAllBlobs(this.bucket, this.keyPrefix, cb);
            break ;
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

    waitUntilTransitioned(cb) {
        let shouldContinue;
        return async.doWhilst(next =>
            this.s3.headObject({
                Bucket: this.bucket,
                Key: this.key,
            }, (err, data) => {
                if (err) {
                    return next(err);
                }
                shouldContinue = data.StorageClass !== this.destinationLocation;
                if (shouldContinue) {
                    return setTimeout(next, 5000);
                }
                return next();
            }),
        () => shouldContinue, cb);
    }
}

module.exports = LifecycleUtility;
