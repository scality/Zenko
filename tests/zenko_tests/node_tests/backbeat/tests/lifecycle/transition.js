const assert = require('assert');
const async = require('async');

const uuid = require('uuid/v4');
const { series } = require('async');

const { scalityS3Client, awsS3Client } = require('../../../s3SDK');
const LifecycleUtility = require('../../LifecycleUtility');

function compareTransitionedData(sourceClient, destinationClient, version, cb) {
    return series([
        next => sourceClient.getObject(next),
        next => sourceClient.putBucketLifecycleConfiguration(new Date(), next),
        next => sourceClient.waitUntilTransitioned(version, next),
        next => destinationClient.getObjectDataFromLocation(next),
        next => sourceClient.getObject(next),
    ], (err, data) => {
        if (err) {
            return cb(err);
        }
        // check data stored on the target cloud
        sourceClient._compareObjectBody(data[0].Body, data[3]);
        // check that object is still readable from Zenko
        sourceClient._compareObjectBody(data[0].Body, data[4].Body);
        return cb();
    });
}

function compareTransitionedColdData(sourceClient, version, cb) {
    return series([
        next => sourceClient.getObject(next),
        next => sourceClient.putBucketLifecycleConfiguration(new Date(), next),
        next => sourceClient.waitUntilTransitioned(version, next),
    ], cb);
}

function checkTransition(destination, sourceClient, destinationClient, version, cb) {
    if (destination.isCold) {
        compareTransitionedColdData(sourceClient, version, cb);
    } else {
        compareTransitionedData(sourceClient, destinationClient, version, cb);
    }
}

const locationParams = {
    LocalStorage: {
        name: 'us-east-1',
        supportsVersioning: true,
    },
    AWS: {
        name: process.env.AWS_BACKEND_DESTINATION_LOCATION,
        bucket: process.env.AWS_CRR_BUCKET_NAME,
        supportsVersioning: true,
    },
    Azure: {
        name: process.env.AZURE_BACKEND_DESTINATION_LOCATION,
        bucket: process.env.AZURE_CRR_BUCKET_NAME,
        supportsVersioning: false,
    },
    DMF: {
        name: process.env.COLD_BACKEND_DESTINATION_LOCATION,
        supportsVersioning: true,
        isCold: true,
        supportsRestore: true,
    },
};

// TODO: ZENKO-4233 enable AZURE/GCP as destination and AWS/AZURE/GCP as source
const testsToRun = [{
    from: 'LocalStorage',
    to: 'AWS',
}, {
    from: 'LocalStorage',
    to: 'DMF',
}];

testsToRun.forEach(test => {
    describe.skip(`Lifecycle transition from ${test.from} to ${test.to}`, () => {
        const srcBucket = `transition-bucket-${uuid()}`;
        const keyPrefix = uuid();
        const cloudServer = new LifecycleUtility(scalityS3Client)
            .setBucket(srcBucket)
            .setKeyPrefix(keyPrefix);
        const cloud = new LifecycleUtility(awsS3Client).setKeyPrefix(keyPrefix);
        const fromLoc = locationParams[test.from];
        const toLoc = locationParams[test.to];
        const prefix = `${keyPrefix}-from-${test.from}-to-${test.to}-`;

        before(() => {
            cloudServer.setSourceLocation(fromLoc.name);
            cloudServer.setDestinationLocation(toLoc.name);
            if (!toLoc.isCold) {
                cloud.setLocationType(test.to);
                cloud.setBucket(toLoc.bucket);
            }
        });

        afterEach(done => series([
            next => cloudServer.deleteVersionedBucket(srcBucket, next),
            next => {
                if (toLoc.isCold) {
                    return next();
                }
                return cloud.clearBucket(next);
            },
        ], done));

        describe('without versioning', () => {
            beforeEach(done => cloudServer.createBucket(srcBucket, done));

            it('should transition a 0 byte object', done => {
                const key = `${prefix}nover-object`;
                cloudServer.setKey(key);
                cloud.setKey(`${srcBucket}/${key}`);
                series([
                    next => cloudServer.putObject(Buffer.from(''), next),
                    next => checkTransition(toLoc, cloudServer, cloud, null, next),
                ], done);
            });

            it('should transition an object', done => {
                const key = `${prefix}nover-object`;
                cloudServer.setKey(key);
                cloud.setKey(`${srcBucket}/${key}`);
                series([
                    next => cloudServer.putObject(Buffer.from(key), next),
                    next => checkTransition(toLoc, cloudServer, cloud, null, next),
                ], done);
            });

            it('should transition a MPU object', done => {
                const key = `${prefix}nover-mpu`;
                cloudServer.setKey(key);
                cloud.setKey(`${srcBucket}/${key}`);
                series([
                    next => cloudServer.putMPU(10, next),
                    next => checkTransition(toLoc, cloudServer, cloud, null, next),
                ], done);
            });
        });

        if (fromLoc.supportsVersioning) {
            describe('with versioning', () => {
                beforeEach(done => cloudServer.createVersionedBucket(srcBucket, done));

                it('should transition a single master version', done => {
                    const key = `${prefix}ver-single-master`;
                    cloudServer.setKey(key);
                    cloud.setKey(`${srcBucket}/${key}`);
                    series([
                        next => cloudServer.putObject(Buffer.from(key), next),
                        next => checkTransition(toLoc, cloudServer, cloud, null, next),
                    ], done);
                });

                it('should transition the master version', done => {
                    const key = `${prefix}ver-master`;
                    cloudServer.setKey(key);
                    cloud.setKey(`${srcBucket}/${key}`);
                    series([
                        next => cloudServer.putObject(Buffer.from(`${key}-1`), next),
                        next => cloudServer.putObject(Buffer.from(`${key}-2`), next),
                        next => cloudServer.putObject(Buffer.from(`${key}-3`), next),
                        next => checkTransition(toLoc, cloudServer, cloud, null, next),
                    ], done);
                });

                it('should transition non current version', done => {
                    const key = `${prefix}ver-non-current`;
                    cloudServer.setKey(key);
                    cloud.setKey(`${srcBucket}/${key}`);
                    let nonCurrentVersion = null;
                    series([
                        next => cloudServer.putObject(Buffer.from(`${key}-1`), (err, data) => {
                            if (data) {
                                nonCurrentVersion = data.VersionId;
                            }
                            next(err);
                        }),
                        next => cloudServer.putObject(Buffer.from(`${key}-2`), next),
                        next => cloudServer.putBucketNCVTLifecycleConfiguration(next),
                        next => cloudServer.waitUntilTransitioned(nonCurrentVersion, next),
                    ], done);
                });
            });
        }
    });
});

const test = {
    from: 'LocalStorage',
    to: 'DMF',
};

describe('Restore', () => {
    const srcBucket = `transition-bucket-${uuid()}`;
    const keyPrefix = uuid();
    const cloudServer = new LifecycleUtility(scalityS3Client)
        .setBucket(srcBucket)
        .setKeyPrefix(keyPrefix);
    const cloud = new LifecycleUtility(awsS3Client).setKeyPrefix(keyPrefix);
    const fromLoc = locationParams[test.from];
    const toLoc = locationParams[test.to];
    const prefix = `${keyPrefix}-from-${test.from}-to-${test.to}-`;

    before(() => {
        cloudServer.setSourceLocation(fromLoc.name);
        cloudServer.setDestinationLocation(toLoc.name);
        if (!toLoc.isCold) {
            cloud.setLocationType(test.to);
            cloud.setBucket(toLoc.bucket);
        }
    });

    afterEach(done => series([
        next => cloudServer.deleteVersionedBucket(srcBucket, next),
        next => {
            if (toLoc.isCold) {
                return next();
            }
            return cloud.clearBucket(next);
        },
    ], done));

    describe('without versioning', () => {
        beforeEach(done => cloudServer.createBucket(srcBucket, done));

        it('should transition a 0 byte object', done => {
            const key = `${prefix}nover-object`;
            cloudServer.setKey(key);
            cloud.setKey(`${srcBucket}/${key}`);
            series([
                next => cloudServer.putObject(Buffer.from('test-object'), next),
                next => checkTransition(toLoc, cloudServer, cloud, null, next),
                next => cloudServer.getObject(next),
                next => cloudServer.putBucketLifecycleConfiguration(new Date(), next),
                next => cloudServer.waitUntilTransitioned(null, next),
                // get object from source - should throw error
                next => cloudServer.getObject(err => {
                    assert.strictEqual(err.code, 'InvalidObjectState');
                    assert.strictEqual(err.statusCode, 403);
                    next();
                }),
                // issue restore
                next => cloudServer.s3.restoreObject({
                    Bucket: srcBucket,
                    Key: key,
                    RestoreRequest: {
                        Days: 1,
                        Tier: 'Standard',
                    },
                }, (err, data) => {
                    if (err) {
                        console.log('ERROR###', err);
                    } else {
                        console.log('DATA###', data);
                    }
                    next();
                }),
                // check if restored
                next => {
                    let shouldContinue;
                    const params = {
                        Bucket: srcBucket,
                        Key: key,
                    };
                    return async.doWhilst(
                        nxt => cloudServer.s3.headObject(params, (err, data) => {
                            if (err) {
                                return nxt(err);
                            }
                            shouldContinue = data.StorageClass !== fromLoc.name;
                            if (shouldContinue) {
                                return setTimeout(nxt, 5000);
                            }
                            return nxt();
                        }),
                        () => shouldContinue,
                        next,
                    );
                },
                // check data
            ], done);
        });
    });
});
