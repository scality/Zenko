const assert = require('assert');
const uuid = require('uuid/v4');
const { series } = require('async');

const { scalityS3Client, awsS3Client } = require('../../../s3SDK');
const LifecycleUtility = require('../../LifecycleUtility');

const LIFECYCLE_TIMEOUT = 300000;
const srcBucket = `${uuid()}-bucket`;
const keyPrefix = `${uuid()}-key-prefix`;
const key = `${keyPrefix}/object`;

const cloudServer = new LifecycleUtility(scalityS3Client)
    .setBucket(srcBucket)
    .setKeyPrefix(keyPrefix)
    .setKey(key)
    .setDestinationLocation(process.env.AWS_BACKEND_DESTINATION_LOCATION);

const s3 = new LifecycleUtility(awsS3Client)
    .setBucket(process.env.AWS_CRR_BUCKET_NAME)
    .setKeyPrefix(keyPrefix)
    .setKey(`${srcBucket}/${key}`);

function compareTransitionedData(cb) {
    return series([
        next => cloudServer.getObject(next),
        next => cloudServer.putBucketLifecycleConfiguration(new Date(), next),
        next => cloudServer.waitUntilTransitioned(next),
        next => s3.getObject(next),
    ], (err, data) => {
        if (err) {
            return cb(err);
        }
        cloudServer._compareObjectBody(data[0].Body, data[3].Body);
        return cb();
    });
};

describe('transition to AWS backend', function() {
    this.timeout(LIFECYCLE_TIMEOUT);

    afterEach(done => series([
        next => cloudServer.deleteVersionedBucket(srcBucket, next),
        next => s3.clearBucket(next),
    ], done));

    describe('without versioning', () => {
        beforeEach(done => cloudServer.createBucket(srcBucket, done));

        it('should transition an object', done => series([
            next => cloudServer.putObject(Buffer.alloc(1), next),
            next => compareTransitionedData(next),
        ], done));
    });

    describe('with versioning', () => {
        beforeEach(done => cloudServer.createVersionedBucket(srcBucket, done));

        it('should transition a single master version', done => series([
            next => cloudServer.putObject(Buffer.alloc(1), next),
            next => compareTransitionedData(next),
        ], done));

        it('should transition the master version', done => series([
            next => cloudServer.putObject(Buffer.alloc(0), next),
            next => cloudServer.putObject(Buffer.alloc(1), next),
            next => cloudServer.putObject(Buffer.alloc(2), next),
            next => compareTransitionedData(next),
        ], done));
    });
});
