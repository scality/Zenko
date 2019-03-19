const async = require('async');

const ReplicationUtility = require('./ReplicationUtility');

class LifecycleUtility extends ReplicationUtility {
    constructor(client) {
        super(client);
        this.client = client;
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

    setDestinationLocation(destinationLocation) {
        this.destinationLocation = destinationLocation;
        return this;
    }

    putObject(data, cb) {
        this.client.putObject({
            Bucket: this.bucket,
            Key: this.key,
            Body: data,
        }, cb);
    }

    getObject(cb) {
        this.client.getObject({
            Bucket: this.bucket,
            Key: this.key,
        }, cb);
    }

    getObjectTagging(cb) {
        this.s3.getObjectTagging({
            Bucket: this.bucket,
            Key: this.key,
        }, cb);
    }

    headObject(cb) {
        this.s3.headObject({
            Bucket: this.bucket,
            Key: this.key,
        }, cb);
    }

    clearBucket(cb) {
        this.deleteAllVersions(this.bucket, this.keyPrefix, cb);
    }

    putBucketLifecycleConfiguration(transitionDate, cb) {
        this.client.putBucketLifecycleConfiguration({
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
            this.client.headObject({
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
