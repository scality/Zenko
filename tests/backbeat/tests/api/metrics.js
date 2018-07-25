const assert = require('assert');
const crypto = require('crypto');
const { series } = require('async');

const { scalityS3Client, awsS3Client } = require('../../s3SDK');
const ReplicationUtility = require('../../ReplicationUtility');
const { makeGETRequest, getResponseBody } = require('../../utils/request');

const scalityUtils = new ReplicationUtility(scalityS3Client);
const awsUtils = new ReplicationUtility(awsS3Client);

const srcBucket = `source-bucket-${Date.now()}`;
const destBucket = process.env.AWS_S3_BACKBEAT_BUCKET_NAME;
const destLocation = process.env.AWS_DESTINATION_LOCATION;
const hex = crypto.createHash('md5')
    .update(Math.random().toString())
    .digest('hex');
const keyPrefix = `${srcBucket}/${hex}`;
const key = `${keyPrefix}/object-to-replicate-${Date.now()}`;

const REPLICATION_TIMEOUT = 300000;

// Delay the get request to make sure redis is populated
function makeDelayedGETRequest(endpoint, cb) {
    setTimeout(() => {
        makeGETRequest(endpoint, cb);
    }, 5000);
}

describe.skip('Backbeat replication metrics', function dF() {
    this.timeout(REPLICATION_TIMEOUT);
    const roleArn = 'arn:aws:iam::root:role/s3-replication-role';

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

    it('should return specific object properties', done => {
        makeGETRequest('/_/backbeat/api/metrics/crr/all', (err, res) => {
            assert.ifError(err);
            assert.equal(res.statusCode, 200);
            getResponseBody(res, (err, body) => {
                assert.ifError(err);
                const metricTypes = ['backlog', 'completions',
                    'throughput', 'failures'];
                const keys = Object.keys(body);
                keys.forEach(key => {
                    assert(metricTypes.includes(key));
                    assert(body[key].description);
                    assert(body[key].results);
                    const resultKeys = Object.keys(body[key].results);
                    assert(resultKeys.includes('count'));
                    assert(resultKeys.includes('size'));
                });
                done();
            });
        });
    });

    it('should get metrics for all sites', done => {
        let prevDataOps;
        let prevDataBytes;
        series([
            next => makeGETRequest('/_/backbeat/api/metrics/crr/all',
                (err, res) => {
                    assert.ifError(err);
                    getResponseBody(res, (err, body) => {
                        assert.ifError(err);
                        prevDataOps = body.backlog.results.count +
                            body.completions.results.count;
                        prevDataBytes = body.backlog.results.size +
                            body.completions.results.size;
                        next();
                    });
                }),
            next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(100),
                next),
            next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
                undefined, next),
            next => makeDelayedGETRequest('/_/backbeat/api/metrics/crr/all',
                (err, res) => {
                    assert.ifError(err);
                    getResponseBody(res, (err, body) => {
                        assert.ifError(err);
                        // Backlog + Completions = replicated object
                        const opResult = body.backlog.results.count +
                            body.completions.results.count;
                        assert(opResult - prevDataOps === 1);
                        const byteResult = body.backlog.results.size +
                            body.completions.results.size;
                        assert(byteResult - prevDataBytes === 100);

                        const throughputSize = body.throughput.results.size;
                        assert(throughputSize > 0);
                        next();
                    });
                }),
        ], done);
    });

    it('should get metrics when specifying metric type', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(100), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
        next => makeGETRequest('/_/backbeat/api/metrics/crr/all/backlog',
            (err, res) => {
                assert.ifError(err);
                assert.equal(res.statusCode, 200);
                getResponseBody(res, (err, body) => {
                    assert.ifError(err);
                    const keys = Object.keys(body);
                    assert.strictEqual(keys.length, 1);
                    assert.strictEqual(keys[0], 'backlog');

                    assert(body.backlog.description);
                    assert(body.backlog.results);
                    const resultKeys = Object.keys(body.backlog.results);
                    assert(resultKeys.includes('count'));
                    assert(resultKeys.includes('size'));
                    next();
                });
            }),
    ], done));

    it('should get metrics when specifying valid site', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(100), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
        next => makeGETRequest(
            `/_/backbeat/api/metrics/crr/${destLocation}`,
            (err, res) => {
                assert.ifError(err);
                assert.equal(res.statusCode, 200);
                getResponseBody(res, (err, body) => {
                    assert.ifError(err);
                    const metricTypes = ['backlog', 'completions', 'throughput',
                        'failures'];
                    const keys = Object.keys(body);
                    keys.forEach(key => {
                        assert(metricTypes.includes(key));
                        assert(body[key].description);
                        assert(body[key].results);
                        const resultKeys = Object.keys(body[key].results);
                        assert(resultKeys.includes('count'));
                        assert(resultKeys.includes('size'));
                    });

                    next();
                });
            }),
    ], done));

    it('should get bucket-level throughput metrics', done => {
        let versionId;
        const destinationKey = `${srcBucket}/${key}`;

        series([
            next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(10000),
                (err, res) => {
                    assert.ifError(err);
                    versionId = res.VersionId;
                    next();
                }),
            next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
                undefined, next),
            next => makeDelayedGETRequest('/_/backbeat/api/metrics/crr/' +
                `${destLocation}/throughput/${destBucket}/${destinationKey}` +
                `?versionId=${versionId}`,
                (err, res) => {
                    assert.ifError(err);
                    assert.equal(res.statusCode, 200);

                    getResponseBody(res, (err, body) => {
                        assert.ifError(err);
                        assert(body.description);
                        assert(body.throughput);

                        next();
                    });
                }),
        ], done);
    });
});
