const uuid = require('uuid/v4');
const { series } = require('async');

const { scalityS3Client, awsS3Client } = require('../../../s3SDK');
const LifecycleUtility = require('../../LifecycleUtility');

function compareTransitionedData(sourceClient, destinationClient, versionId, cb) {
    return series([
        next => sourceClient.getObject(versionId, next),
        next => sourceClient.putBucketLifecycleConfiguration(new Date(), next),
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
    return series([
        next => sourceClient.getObject(versionId, next),
        next => sourceClient.putBucketLifecycleConfiguration(new Date(), next),
        next => sourceClient.waitUntilTransitioned(versionId, next),
    ], cb);
}

// function checkRestoration(destination, sourceClient, versionId, cb) {
//     if (!destination.supportsRestore) {
//         return process.nextTick(cb);
//     }
//     return series([
//         next => sourceClient.getObject(versionId, err => {
//             assert.strictEqual(err.code, 'InvalidObjectState');
//             assert.strictEqual(err.statusCode, 403);
//             return next();
//         }),
//         next => sourceClient.putRestoreObject(versionId, next),
//         next => sourceClient.waitUntilRestored(versionId, next),
//     ], cb);
// }

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
    to: 'DMF',
}];

testsToRun.forEach(test => {
    // eslint-disable-next-line prefer-arrow-callback
    describe(`Lifecycle transition from ${test.from} to ${test.to}`, function () {
        const srcBucket = `transition-bucket-${uuid()}`;
        const keyPrefix = uuid();
        const cloudServer = new LifecycleUtility(scalityS3Client)
            .setBucket(srcBucket)
            .setKeyPrefix(keyPrefix);
        const cloud = new LifecycleUtility(awsS3Client).setKeyPrefix(keyPrefix);
        const fromLoc = locationParams[test.from];
        const toLoc = locationParams[test.to];
        const prefix = `${keyPrefix}-from-${test.from}-to-${test.to}-`;

        // if (toLoc.isCold) {
        //     this.retries(3);
        //     this.timeout(120000);
        // }

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

            // it('should transition a 0 byte object', done => {
            //     const key = `${prefix}nover-object`;
            //     cloudServer.setKey(key);
            //     cloud.setKey(`${srcBucket}/${key}`);
            //     series([
            //         next => cloudServer.putObject(Buffer.from(''), next),
            //         next => checkTransition(toLoc, cloudServer, cloud, null, next),
            //         next => checkRestoration(toLoc, cloudServer, null, next),
            //     ], done);
            // });

            it('should transition an object', done => {
                const key = `${prefix}nover-n2b-object`;
                cloudServer.setKey(key);
                cloud.setKey(`${srcBucket}/${key}`);
                series([
                    next => cloudServer.putObject(Buffer.from(key), next),
                    next => checkTransition(toLoc, cloudServer, cloud, null, next),
                    // next => checkRestoration(toLoc, cloudServer, null, next),
                ], done);
            });

            // it('should transition an object 2', done => {
            //     const key = `${prefix}nover-n2b-object2`;
            //     cloudServer.setKey(key);
            //     cloud.setKey(`${srcBucket}/${key}`);
            //     series([
            //         next => cloudServer.putObject(Buffer.from(key), next),
            //         next => checkTransition(toLoc, cloudServer, cloud, null, next),
            //         // next => checkRestoration(toLoc, cloudServer, null, next),
            //     ], done);
            // });

            // it('should transition a MPU object', done => {
            //     const key = `${prefix}nover-mpu`;
            //     cloudServer.setKey(key);
            //     cloud.setKey(`${srcBucket}/${key}`);
            //     series([
            //         next => cloudServer.putMPU(10, next),
            //         next => checkTransition(toLoc, cloudServer, cloud, null, next),
            //         next => checkRestoration(toLoc, cloudServer, null, next),
            //     ], done);
            // });
        });

        // if (fromLoc.supportsVersioning) {
        //     describe('with versioning', () => {
        //         beforeEach(done => cloudServer.createVersionedBucket(srcBucket, done));

        //         it('should transition a single master version', done => {
        //             const key = `${prefix}ver-single-master`;
        //             cloudServer.setKey(key);
        //             cloud.setKey(`${srcBucket}/${key}`);
        //             let versionId = null;
        //             series([
        //                 next => cloudServer.putObject(Buffer.from(key), (err, data) => {
        //                     if (data) {
        //                         versionId = data.VersionId;
        //                     }
        //                     next(err);
        //                 }),
        //                 next => checkTransition(toLoc, cloudServer, cloud, versionId, next),
        //                 next => checkRestoration(toLoc, cloudServer, versionId, next),
        //             ], done);
        //         });

        //         it('should transition the master version', done => {
        //             const key = `${prefix}ver-master`;
        //             cloudServer.setKey(key);
        //             cloud.setKey(`${srcBucket}/${key}`);
        //             let versionId = null;
        //             series([
        //                 next => cloudServer.putObject(Buffer.from(`${key}-1`), next),
        //                 next => cloudServer.putObject(Buffer.from(`${key}-2`), next),
        //                 next => cloudServer.putObject(Buffer.from(`${key}-3`), (err, data) => {
        //                     if (data) {
        //                         versionId = data.VersionId;
        //                     }
        //                     next(err);
        //                 }),
        //                 next => checkTransition(toLoc, cloudServer, cloud, versionId, next),
        //                 next => checkRestoration(toLoc, cloudServer, versionId, next),
        //             ], done);
        //         });

        //         it('should transition non current version', done => {
        //             const key = `${prefix}ver-non-current`;
        //             cloudServer.setKey(key);
        //             cloud.setKey(`${srcBucket}/${key}`);
        //             let nonCurrentVersionId = null;
        //             series([
        //                 next => cloudServer.putObject(Buffer.from(`${key}-1`), (err, data) => {
        //                     if (data) {
        //                         nonCurrentVersionId = data.VersionId;
        //                     }
        //                     next(err);
        //                 }),
        //                 next => cloudServer.putObject(Buffer.from(`${key}-2`), next),
        //                 next => cloudServer.putBucketNCVTLifecycleConfiguration(next),
        //                 next => cloudServer.waitUntilTransitioned(nonCurrentVersionId, next),
        //                 next => checkRestoration(toLoc, cloudServer, nonCurrentVersionId, next),
        //             ], done);
        //         });
        //     });
        // }
    });
});
