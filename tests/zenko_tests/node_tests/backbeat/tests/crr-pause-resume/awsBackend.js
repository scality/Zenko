const assert = require('assert');
const crypto = require('crypto');
const  { series, parallel, timesSeries, each } = require('async');

const { scalityS3Client, awsS3Client } = require('../../../s3SDK');
const ReplicationUtility = require('../../ReplicationUtility');
const BackbeatAPIUtility = require('../../BackbeatAPIUtility');

const scalityUtils = new ReplicationUtility(scalityS3Client);
const awsUtils = new ReplicationUtility(awsS3Client);
const backbeatAPIUtils = new BackbeatAPIUtility();
const srcBucket = `source-bucket-${Date.now()}`;
const destBucket = process.env.AWS_CRR_BUCKET_NAME;
const destLocation = process.env.AWS_BACKEND_DESTINATION_LOCATION;
const hex = crypto.createHash('md5')
    .update(Math.random().toString())
    .digest('hex');
const keyPrefix = `${srcBucket}/${hex}`;
const key = `${keyPrefix}/object-to-replicate-${Date.now()}`;
const key2 = `${key}-2`;
// eslint-disable-next-line
const REPLICATION_TIMEOUT = 600000;

// NOTE: A setTimeout of 5 seconds is added after each pauseReplication and
// resumeReplication call, to ensure that any delays introduced from redis
// will not cause race conditions and error out the tests.
// There is also a setTimeout of 15 seconds before assertNoObject in the
// first test 'should pause and resume replication'. This allows us to fully
// check that the object DNE due to the replication pause, and not because
// the tests checked before replication was complete.

describe('Replication Pause-Resume with AWS backend', function() {
    this.timeout(REPLICATION_TIMEOUT);
    let roleArn = 'arn:aws:iam::root:role/s3-replication-role';

    beforeEach(done => series([
        next => scalityUtils.createVersionedBucket(srcBucket, next),
        next => scalityUtils.putBucketReplicationMultipleBackend(srcBucket,
            destBucket, roleArn, destLocation, next),
    ], done));

    afterEach(done => series([
        next => scalityUtils.deleteVersionedBucket(srcBucket, next),
        next => awsUtils.deleteAllVersions(destBucket,
            `${srcBucket}/${keyPrefix}`, next),
    ], done));

    after(done => backbeatAPIUtils.resumeReplication(null, null, null, done));

    it.only('should pause and resume replication', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => scalityUtils.waitUntilReplicated(srcBucket, key,
            undefined, next),
        next => backbeatAPIUtils.pauseReplication(null, next),
        next => setTimeout(next, 5000),
        next => backbeatAPIUtils.getReplicationStatus(null, (err, data) => {
            assert.ifError(err);
            assert(data[destLocation]);
            assert.strictEqual(data[destLocation], 'disabled');
            return next();
        }),
        next => scalityUtils.putObject(srcBucket, key2, Buffer.alloc(1),
            next),
        next => setTimeout(next, 15000),
        next => awsUtils.assertNoObject(destBucket, key2, next),
        next => backbeatAPIUtils.resumeReplication(null, null, null, next),
        next => setTimeout(next, 5000),
        next => backbeatAPIUtils.getReplicationStatus(null, (err, data) => {
            assert.ifError(err);
            assert(data[destLocation]);
            assert.strictEqual(data[destLocation], 'enabled');
            return next();
        }),
        next => scalityUtils.waitUntilReplicated(srcBucket, key2,
            undefined, next),
    ], done));

    it('should pause, resume, get status by location name', done => series([
        next => backbeatAPIUtils.pauseReplication(destLocation, next),
        next => setTimeout(next, 5000),
        next => backbeatAPIUtils.getReplicationStatus(null, (err, data) => {
            assert.ifError(err);
            assert(data[destLocation]);
            assert.strictEqual(data[destLocation], 'disabled');
            return next();
        }),
        next => backbeatAPIUtils.resumeReplication(destLocation, false, null,
            next),
        next => setTimeout(next, 5000),
        next => backbeatAPIUtils.getReplicationStatus(null, (err, data) => {
            assert.ifError(err);
            assert(data[destLocation]);
            assert.strictEqual(data[destLocation], 'enabled');
            return next();
        }),
    ], done));

    it('should get 404 error in data for status of non-existent location',
        done => {
        return backbeatAPIUtils.getReplicationStatus('non-existent-location',
            (err, data) => {
            assert.ifError(err);
            assert.strictEqual(data.code, 404);
            assert.strictEqual(data.RouteNotFound, true);
            return done();
        });
    });

    it('should be able to set a CRR resume schedule', done => series([
        next => backbeatAPIUtils.pauseReplication(null, next),
        next => setTimeout(next, 5000),
        next => backbeatAPIUtils.getReplicationStatus(null, (err, data) => {
            assert.ifError(err);
            assert(data[destLocation]);
            assert.strictEqual(data[destLocation], 'disabled');
            return next();
        }),
        next => backbeatAPIUtils.resumeReplication(destLocation, true, 1, next),
        next => setTimeout(next, 5000),
        next => backbeatAPIUtils.getReplicationResumeSchedule(destLocation,
            (err, data) => {
            assert.ifError(err);
            assert(data[destLocation]);
            const requestTimeMs = Date.now();
            const resumeTime = new Date(data[destLocation]);
            const resumeTimeMs = resumeTime.getTime();
            const timediff = resumeTimeMs - requestTimeMs;
            const hrdiff = (timediff/1000)/3600;
            assert.strictEqual(Math.round(hrdiff), 1);
            return next();
        }),
    ], done));
});
