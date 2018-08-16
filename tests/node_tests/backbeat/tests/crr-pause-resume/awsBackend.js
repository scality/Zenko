const assert = require('assert');
const crypto = require('crypto');
const uuid = require('uuid/v4');
const  { series, parallel, timesSeries, each } = require('async');

const { scalityS3Client, awsS3Client } = require('../../../s3SDK');
const ReplicationUtility = require('../../ReplicationUtility');
const BackbeatAPIUtility = require('../../BackbeatAPIUtility');

const scalityUtils = new ReplicationUtility(scalityS3Client);
const awsUtils = new ReplicationUtility(awsS3Client);
const backbeatAPIUtils = new BackbeatAPIUtility();
const destBucket = process.env.AWS_S3_BACKBEAT_BUCKET_NAME;
const destLocation = process.env.AWS_S3_BACKEND_DESTINATION_LOCATION;
const hex = crypto.createHash('md5')
    .update(Math.random().toString())
    .digest('hex');
// eslint-disable-next-line
const REPLICATION_TIMEOUT = 300000;

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

    beforeEach(function beforeEachF(done) {
        this.currentTest.srcBucket =
            `source-bucket-${uuid().replace(/-/g, '')}`;
        this.currentTest.keyPrefix = `${this.currentTest.srcBucket}/${hex}`;
        this.currentTest.key =
            `${this.currentTest.keyPrefix}/object-to-replicate-` +
            `${uuid().replace(/-/g, '')}`;
        this.currentTest.key2 = `${this.currentTest.key}-2`;
        series([
            next => scalityUtils.createVersionedBucket(
                this.currentTest.srcBucket, next),
            next => scalityUtils.putBucketReplicationMultipleBackend(
                this.currentTest.srcBucket, destBucket, roleArn, destLocation,
                next),
        ], done);
    });

    afterEach(function afterEachF(done) {
        return series([
            next => scalityUtils.deleteVersionedBucket(
                this.currentTest.srcBucket, next),
            next => awsUtils.deleteAllVersions(destBucket,
                `${this.currentTest.srcBucket}/${this.currentTest.keyPrefix}`,
                next),
        ], done);
    });

    after(done => backbeatAPIUtils.resumeReplication(null, null, null, done));

    it('should pause and resume replication', function itF(done) {
        return series([
        next => scalityUtils.putObject(this.test.srcBucket, this.test.key,
            Buffer.alloc(1), next),
        next => scalityUtils.waitUntilReplicated(this.test.srcBucket,
            this.test.key, undefined, next),
        next => backbeatAPIUtils.pauseReplication(null, next),
        next => setTimeout(next, 10000),
        next => backbeatAPIUtils.getReplicationStatus(null, (err, data) => {
            assert.ifError(err);
            assert(data[destLocation]);
            assert.strictEqual(data[destLocation], 'disabled');
            return next();
        }),
        next => scalityUtils.putObject(this.test.srcBucket, this.test.key2,
            Buffer.alloc(1), next),
        next => setTimeout(next, 15000),
        next => awsUtils.assertNoObject(destBucket, this.test.key2, next),
        next => backbeatAPIUtils.resumeReplication(null, null, null, next),
        next => setTimeout(next, 10000),
        next => backbeatAPIUtils.getReplicationStatus(null, (err, data) => {
            assert.ifError(err);
            assert(data[destLocation]);
            assert.strictEqual(data[destLocation], 'enabled');
            return next();
        }),
        next => scalityUtils.waitUntilReplicated(this.test.srcBucket,
            this.test.key2, undefined, next),
    ], done)});

    it('should pause, resume, get status by location name', function itF(done) {
        return series([
            next => backbeatAPIUtils.pauseReplication(destLocation, next),
            next => setTimeout(next, 10000),
            next => backbeatAPIUtils.getReplicationStatus(null, (err, data) => {
                assert.ifError(err);
                assert(data[destLocation]);
                assert.strictEqual(data[destLocation], 'disabled');
                return next();
            }),
            next => backbeatAPIUtils.resumeReplication(destLocation, false, null,
                next),
            next => setTimeout(next, 10000),
            next => backbeatAPIUtils.getReplicationStatus(null, (err, data) => {
                assert.ifError(err);
                assert(data[destLocation]);
                assert.strictEqual(data[destLocation], 'enabled');
                return next();
            }),
        ], done);
    });

    it('should get 404 error in data for status of non-existent location',
    function itF(done) {
        return backbeatAPIUtils.getReplicationStatus('non-existent-location',
            (err, data) => {
            assert.ifError(err);
            assert.strictEqual(data.code, 404);
            assert.strictEqual(data.RouteNotFound, true);
            return done();
        });
    });

    it('should be able to set a CRR resume schedule', function itF(done) {
        return series([
            next => backbeatAPIUtils.pauseReplication(null, next),
            next => setTimeout(next, 10000),
            next => backbeatAPIUtils.getReplicationStatus(null, (err, data) => {
                assert.ifError(err);
                assert(data[destLocation]);
                assert.strictEqual(data[destLocation], 'disabled');
                return next();
            }),
            next => backbeatAPIUtils.resumeReplication(destLocation, true, 1,
                next),
            next => setTimeout(next, 10000),
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
        ], done);
    });
});
