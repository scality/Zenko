const assert = require('assert');
const uuid = require('uuid/v4');
const { series } = require('async');

const { scalityS3Client, awsS3Client } = require('../../../s3SDK');
const LifecycleUtility = require('../../LifecycleUtility');

function compareTransitionedData(sourceClient, destinationClient, versionId, cb) {
    return series([
        next => sourceClient.getObject(versionId, next),
        next => sourceClient.putBucketLifecycleConfiguration(new Date(new Date().setUTCHours(0, 0, 0, 0)), next),
        next => sourceClient.waitUntilTransitioned(versionId, next),
        next => destinationClient.getObjectDataFromLocation(next),
        next => sourceClient.getObject(versionId, next),
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

function compareTransitionedColdData(sourceClient, versionId, cb) {
    // eslint-disable-next-line no-console
    console.log(`[DEBUG] 🧊 Starting cold data transition check for versionId: ${versionId}`);
    
    return series([
        next => {
            // eslint-disable-next-line no-console
            console.log(`[DEBUG] 📖 Step 1: Getting original object data`);
            sourceClient.getObject(versionId, (err, data) => {
                if (err) {
                    // eslint-disable-next-line no-console
                    console.error(`[DEBUG] ❌ Failed to get original object:`, err.message);
                } else {
                    // eslint-disable-next-line no-console
                    console.log(`[DEBUG] ✅ Got original object data, size: ${data.Body ? data.Body.length : 'unknown'}`);
                }
                next(err, data);
            });
        },
        next => {
            // eslint-disable-next-line no-console
            console.log(`[DEBUG] 🔄 Step 2: Putting bucket lifecycle configuration`);
            const transitionDate = new Date(new Date().setUTCHours(0, 0, 0, 0));
            // eslint-disable-next-line no-console
            console.log(`[DEBUG] - Transition date: ${transitionDate.toISOString()}`);
            
            sourceClient.putBucketLifecycleConfiguration(transitionDate, (err) => {
                if (err) {
                    // eslint-disable-next-line no-console
                    console.error(`[DEBUG] ❌ Failed to put lifecycle configuration:`, err.message);
                } else {
                    // eslint-disable-next-line no-console
                    console.log(`[DEBUG] ✅ Lifecycle configuration set successfully`);
                }
                next(err);
            });
        },
        next => {
            // eslint-disable-next-line no-console
            console.log(`[DEBUG] - VersionId: ${versionId}`);
            // eslint-disable-next-line no-console
            console.log(`[DEBUG] - Destination: DMF (cold storage)`);
            
            const startTime = Date.now();
            sourceClient.waitUntilTransitioned(versionId, (err) => {
                const duration = (Date.now() - startTime) / 1000;
                if (err) {
                    // eslint-disable-next-line no-console
                    console.error(`[DEBUG] ❌ Transition failed after ${duration}s:`, err.message);
                } else {
                    // eslint-disable-next-line no-console
                    console.log(`[DEBUG] ✅ Transition completed successfully after ${duration}s`);
                }
                next(err);
            });
        },
    ], (err, results) => {
        if (err) {
            // eslint-disable-next-line no-console
            console.error(`[DEBUG] ❌ Cold data transition check failed:`, err.message);
        } else {
            // eslint-disable-next-line no-console
            console.log(`[DEBUG] ✅ Cold data transition check completed successfully`);
        }
        cb(err, results);
    });
}

function checkRestoration(destination, sourceClient, versionId, cb) {
    if (!destination.supportsRestore) {
        // eslint-disable-next-line no-console
        console.log(`[DEBUG] ⏭️ Destination doesn't support restore, skipping restoration check`);
        return process.nextTick(cb);
    }
    
    // eslint-disable-next-line no-console
    console.log(`[DEBUG] 🔄 Starting restoration process for versionId: ${versionId}`);
    
    return series([
        next => {
            // eslint-disable-next-line no-console
            console.log(`[DEBUG] 🧪 Step 1: Verifying object is in cold storage (should be inaccessible)`);
            sourceClient.getObject(versionId, err => {
                if (err && err.name === 'InvalidObjectState' && err.$metadata?.httpStatusCode === 403) {
                    // eslint-disable-next-line no-console
                    console.log(`[DEBUG] ✅ Object is properly in cold storage (InvalidObjectState)`);
                    return next();
                } else if (err) {
                    // eslint-disable-next-line no-console
                    console.error(`[DEBUG] ❌ Unexpected error accessing cold object:`, err.message, err.Code);
                    return next(err);
                } else {
                    // eslint-disable-next-line no-console
                    console.error(`[DEBUG] ❌ Object should be inaccessible but isn't - cold storage may have failed`);
                    return next(new Error('Object should be in cold storage but is still accessible'));
                }
            });
        },
        next => {
            // eslint-disable-next-line no-console
            console.log(`[DEBUG] 🔄 Step 2: Initiating object restoration`);
            sourceClient.putRestoreObject(versionId, (err) => {
                if (err) {
                    // eslint-disable-next-line no-console
                    console.error(`[DEBUG] ❌ Failed to initiate restoration:`, err.message);
                } else {
                    // eslint-disable-next-line no-console
                    console.log(`[DEBUG] ✅ Restoration initiated successfully`);
                }
                next(err);
            });
        },
        next => {
            // eslint-disable-next-line no-console
            console.log(`[DEBUG] ⏳ Step 3: Waiting for restoration to complete`);
            const startTime = Date.now();
            sourceClient.waitUntilRestored(versionId, (err) => {
                const duration = (Date.now() - startTime) / 1000;
                if (err) {
                    // eslint-disable-next-line no-console
                    console.error(`[DEBUG] ❌ Restoration failed after ${duration}s:`, err.message);
                } else {
                    // eslint-disable-next-line no-console
                    console.log(`[DEBUG] ✅ Restoration completed successfully after ${duration}s`);
                }
                next(err);
            });
        },
    ], (err) => {
        if (err) {
            // eslint-disable-next-line no-console
            console.error(`[DEBUG] ❌ Restoration process failed:`, err.message);
        } else {
            // eslint-disable-next-line no-console
            console.log(`[DEBUG] ✅ Restoration process completed successfully`);
        }
        cb(err);
    });
}

function checkTransition(destination, sourceClient, destinationClient, versionId, cb) {
    if (destination.isCold) {
        compareTransitionedColdData(sourceClient, versionId, cb);
    } else {
        compareTransitionedData(sourceClient, destinationClient, versionId, cb);
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
    // eslint-disable-next-line prefer-arrow-callback
    describe(`Lifecycle transition from ${test.from} to ${test.to}`, function () {
        const srcBucket = `transition-${uuid()}`;
        const keyPrefix = uuid();
        const cloudServer = new LifecycleUtility(scalityS3Client)
            .setBucket(srcBucket)
            .setKeyPrefix(keyPrefix);
        const cloud = new LifecycleUtility(awsS3Client).setKeyPrefix(keyPrefix);
        const fromLoc = locationParams[test.from];
        const toLoc = locationParams[test.to];
        const prefix = `${keyPrefix}-from-${test.from}-to-${test.to}-`;

        // GC consumer might take a long time to consume its entries.
        // If it is the case, timeout after 5 minutes and retry.
        if (toLoc.isCold) {
            this.retries(3);
            this.timeout(360000);
        }

        before(() => {
            cloudServer.setSourceLocation(fromLoc.name);
            cloudServer.setDestinationLocation(toLoc.name);
            if (!toLoc.isCold) {
                cloud.setLocationType(test.to);
                cloud.setBucket(toLoc.bucket);
            }
        });

        afterEach(function (done) {
            series([
                next => cloudServer.deleteVersionedBucket(srcBucket, next),
                next => {
                    if (toLoc.isCold) {
                        return next();
                    }
                    return cloud.clearBucket(next);
                },
            ], err => {
                if (err || (!this.currentTest.isPending() && !this.currentTest.isPassed())) {
                    const testName = this.currentTest.fullTitle();
                    const retry = this.currentTest.currentRetry();
                    // eslint-disable-next-line no-console
                    console.log(`   FAILED ${testName} [retry #${retry}] : ${srcBucket}`);
                }
                done(err);
            });
        });

        describe('without versioning', () => {
            beforeEach(done => cloudServer.createBucket(srcBucket, done));

            it('should transition a 0 byte object', done => {
                const key = `${prefix}nover-0-byte-object`;
                cloudServer.setKey(key);
                cloud.setKey(`${srcBucket}/${key}`);
                series([
                    next => cloudServer.putObject(Buffer.from(''), next),
                    next => checkTransition(toLoc, cloudServer, cloud, null, next),
                    next => checkRestoration(toLoc, cloudServer, null, next),
                ], done);
            }).retries(3);

            it.only('should transition an object', done => {
                // eslint-disable-next-line no-console
                console.log(`Starting transition`);
                const key = `${prefix}nover-object`;
                cloudServer.setKey(key);
                cloud.setKey(`${srcBucket}/${key}`);
                series([
                    next => cloudServer.putObject(Buffer.from(key), next),
                    next => checkTransition(toLoc, cloudServer, cloud, null, next),
                    next => checkRestoration(toLoc, cloudServer, null, next),
                ], done);
            });

            it('should transition a MPU object', done => {
                const key = `${prefix}nover-mpu`;
                cloudServer.setKey(key);
                cloud.setKey(`${srcBucket}/${key}`);
                series([
                    next => cloudServer.putMPU(10, next),
                    next => checkTransition(toLoc, cloudServer, cloud, null, next),
                    next => checkRestoration(toLoc, cloudServer, null, next),
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
                    let versionId = null;
                    series([
                        next => cloudServer.putObject(Buffer.from(key), (err, data) => {
                            if (data) {
                                versionId = data.VersionId;
                            }
                            next(err);
                        }),
                        next => checkTransition(toLoc, cloudServer, cloud, versionId, next),
                        next => checkRestoration(toLoc, cloudServer, versionId, next),
                    ], done);
                });

                it('should transition the master version', done => {
                    const key = `${prefix}ver-master`;
                    cloudServer.setKey(key);
                    cloud.setKey(`${srcBucket}/${key}`);
                    let versionId = null;
                    series([
                        next => cloudServer.putObject(Buffer.from(`${key}-1`), next),
                        next => cloudServer.putObject(Buffer.from(`${key}-2`), next),
                        next => cloudServer.putObject(Buffer.from(`${key}-3`), (err, data) => {
                            if (data) {
                                versionId = data.VersionId;
                            }
                            next(err);
                        }),
                        next => checkTransition(toLoc, cloudServer, cloud, versionId, next),
                        next => checkRestoration(toLoc, cloudServer, versionId, next),
                    ], done);
                });

                it('should transition non current version', done => {
                    const key = `${prefix}ver-non-current`;
                    cloudServer.setKey(key);
                    cloud.setKey(`${srcBucket}/${key}`);
                    let nonCurrentVersionId = null;
                    series([
                        next => cloudServer.putObject(Buffer.from(`${key}-1`), (err, data) => {
                            if (data) {
                                nonCurrentVersionId = data.VersionId;
                            }
                            next(err);
                        }),
                        next => cloudServer.putObject(Buffer.from(`${key}-2`), next),
                        next => cloudServer.putBucketNCVTLifecycleConfiguration(next),
                        next => cloudServer.waitUntilTransitioned(nonCurrentVersionId, next),
                        next => checkRestoration(toLoc, cloudServer, nonCurrentVersionId, next),
                    ], done);
                });
            });

            describe('with versioning suspended', () => {
                beforeEach(done => cloudServer.createVersionedBucket(srcBucket, done));

                it('should transition an object', done => {
                    const key = `${prefix}ver-suspended-master`;
                    cloudServer.setKey(key);
                    cloud.setKey(`${srcBucket}/${key}`);
                    let versionId = null;
                    series([
                        next => cloudServer.putBucketVersioningConfiguration('Suspended', next),
                        next => cloudServer.putObject(Buffer.from(key), (err, data) => {
                            if (data) {
                                versionId = data.VersionId;
                            }
                            next(err);
                        }),
                        next => checkTransition(toLoc, cloudServer, cloud, versionId, next),
                        next => checkRestoration(toLoc, cloudServer, versionId, next),
                    ], done);
                });

                it('should transition non-versioned object', done => {
                    const key = `${prefix}ver-suspended-master`;
                    cloudServer.setKey(key);
                    cloud.setKey(`${srcBucket}/${key}`);
                    series([
                        next => cloudServer.putObject(Buffer.from(key), next),
                        next => cloudServer.putBucketVersioningConfiguration('Suspended', next),
                        next => checkTransition(toLoc, cloudServer, cloud, null, next),
                        next => checkRestoration(toLoc, cloudServer, null, next),
                    ], done);
                });
            });
        }
    });
});
