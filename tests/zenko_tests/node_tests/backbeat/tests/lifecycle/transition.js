const uuid = require('uuid/v4');
const { series } = require('async');

const { scalityS3Client, awsS3Client } = require('../../../s3SDK');
const LifecycleUtility = require('../../LifecycleUtility');

const srcBucket = `transition-bucket-${uuid()}`;
const keyPrefix = uuid();

const cloudServer = new LifecycleUtility(scalityS3Client)
    .setBucket(srcBucket)
    .setKeyPrefix(keyPrefix);

const cloud = new LifecycleUtility(awsS3Client).setKeyPrefix(keyPrefix);

function compareTransitionedData(cb) {
    return series([
        next => cloudServer.getObject(next),
        next => cloudServer.putBucketLifecycleConfiguration(new Date(), next),
        next => cloudServer.waitUntilTransitioned(next),
        next => cloud.getObjectDataFromLocation(next),
        next => cloudServer.getObject(next),
    ], (err, data) => {
        if (err) {
            return cb(err);
        }
        // check data stored on the target cloud
        cloudServer._compareObjectBody(data[0].Body, data[3]);
        // check that object is still readable from Zenko
        cloudServer._compareObjectBody(data[0].Body, data[4].Body);
        return cb();
    });
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
};

// TODO: ZENKO-4233 enable AZURE/GCP as destination and AWS/AZURE/GCP as source
const testsToRun = [{
    from: 'LocalStorage',
    to: 'AWS',
}];

testsToRun.forEach(test => {
    describe(`Lifecycle transition from ${test.from} to ${test.to}`, () => {
        const fromLoc = locationParams[test.from];
        const toLoc = locationParams[test.to];

        before(() => {
            cloudServer.setSourceLocation(fromLoc.name);
            cloudServer.setDestinationLocation(toLoc.name);
            cloud.setLocationType(test.to);
            cloud.setBucket(toLoc.bucket);
        });

        afterEach(done => series([
            next => cloudServer.deleteVersionedBucket(srcBucket, next),
            next => cloud.clearBucket(next),
        ], done));

        describe('without versioning', () => {
            beforeEach(done => cloudServer.createBucket(srcBucket, done));

            it('should transition an object', done => {
                const key = `${keyPrefix}-from-${test.from}-to-${test.to}-`
                      + 'nover-object';
                cloudServer.setKey(key);
                cloud.setKey(`${srcBucket}/${key}`);
                series([
                    next => cloudServer.putObject(Buffer.from(key), next),
                    next => compareTransitionedData(next),
                ], done);
            });

            it('should transition a MPU object', done => {
                const key = `${keyPrefix}-from-${test.from}-to-${test.to}-`
                      + 'nover-mpu';
                cloudServer.setKey(key);
                cloud.setKey(`${srcBucket}/${key}`);
                series([
                    next => cloudServer.putMPU(10, next),
                    next => compareTransitionedData(next),
                ], done);
            });
        });

        if (fromLoc.supportsVersioning) {
            describe('with versioning', () => {
                beforeEach(done => cloudServer.createVersionedBucket(srcBucket, done));

                it('should transition a single master version', done => {
                    const key = `${keyPrefix}-from-${test.from}-to-`
                          + `${test.to}-ver-single-master`;
                    cloudServer.setKey(key);
                    cloud.setKey(`${srcBucket}/${key}`);
                    series([
                        next => cloudServer.putObject(Buffer.from(key), next),
                        next => compareTransitionedData(next),
                    ], done);
                });

                it('should transition the master version', done => {
                    const key = `${keyPrefix}-from-${test.from}-to-`
                          + `${test.to}-ver-master`;
                    cloudServer.setKey(key);
                    cloud.setKey(`${srcBucket}/${key}`);
                    series([
                        next => cloudServer.putObject(Buffer.from(`${key}-1`), next),
                        next => cloudServer.putObject(Buffer.from(`${key}-2`), next),
                        next => cloudServer.putObject(Buffer.from(`${key}-3`), next),
                        next => compareTransitionedData(next),
                    ], done);
                });
            });
        }
    });
});
