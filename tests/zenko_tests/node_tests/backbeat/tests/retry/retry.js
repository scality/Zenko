const assert = require('assert');
const crypto = require('crypto');
const {
    series, parallel, times, timesSeries, doWhilst,
} = require('async');

const { scalityS3Client, awsS3Client } = require('../../../s3SDK');
const ReplicationUtility = require('../../ReplicationUtility');
const { makeGETRequest, makePOSTRequest, getResponseBody } = require('../../../utils/request');

const scalityUtils = new ReplicationUtility(scalityS3Client);
const awsUtils = new ReplicationUtility(awsS3Client);
const srcBucket = `source-bucket-${Date.now()}`;
const destFailBucket = process.env.AWS_S3_FAIL_BACKBEAT_BUCKET_NAME;
const destFailLocation = process.env.AWS_S3_FAIL_BACKEND_DESTINATION_LOCATION;

const hex = crypto.createHash('md5')
    .update(Math.random().toString())
    .digest('hex');
const keyPrefix = `${srcBucket}/${hex}`;
const key = `object-to-replicate-${Date.now()}`;
const REPLICATION_TIMEOUT = 300000;

function checkMetrics(
    prevBacklog,
    prevCompletions,
    prevFailures,
    prevPending,
    body,
) {
    const {
        backlog, completions, failures, pending,
    } = body;
    assert.strictEqual((backlog.results.count - prevBacklog.count), 0);
    assert.strictEqual((backlog.results.size - prevBacklog.size), 0);
    assert.strictEqual((completions.results.count - prevCompletions.count), 1);
    assert.strictEqual((completions.results.size - prevCompletions.size), 1);
    assert.strictEqual((failures.results.count - prevFailures.count), 0);
    assert.strictEqual((failures.results.size - prevFailures.size), 0);
    assert.strictEqual((pending.results.count - prevPending.count), 0);
    assert.strictEqual((pending.results.size - prevPending.size), 0);
}

function performRetries(keys, done) {
    return series([
        next => awsUtils.deleteVersionedBucket(destFailBucket, next),
        next => times(
            keys.length,
            (n, cb) => scalityUtils.putObject(
                srcBucket,
                keys[n],
                Buffer.alloc(1),
                cb,
            ),
            next,
        ),
        next => times(
            keys.length,
            (n, cb) => scalityUtils.waitWhilePendingCRR(srcBucket, keys[n], cb),
            next,
        ),
        next => times(
            keys.length,
            (n, cb) => scalityUtils.getHeadObject(
                srcBucket,
                keys[n],
                (err, data) => {
                    if (err) {
                        return cb(err);
                    }
                    const { ReplicationStatus, Metadata, VersionId } = data;
                    // eslint-disable-next-line
                    versionId = VersionId;
                    assert.strictEqual(ReplicationStatus, 'FAILED');
                    assert.strictEqual(
                        Metadata[`${destFailLocation}-replication-status`],
                        'FAILED',
                    );
                    return setTimeout(() => cb(), 5000);
                },
            ),
            next,
        ),
        next => makeGETRequest(
            '/_/backbeat/api/crr/failed',
            (err, res) => {
                assert.ifError(err);
                return getResponseBody(res, (err, body) => {
                    assert.ifError(err);
                    // eslint-disable-next-line
                    postBody = JSON.stringify(body.Versions);
                    next();
                });
            },
        ),
        next => awsUtils.createVersionedBucket(destFailBucket, next),
        next => makePOSTRequest(
            '/_/backbeat/api/crr/failed',
            // eslint-disable-next-line
            postBody,
            (err, res) => {
                assert.ifError(err);
                return getResponseBody(res, (err) => {
                    assert.ifError(err);
                    return next();
                });
            },
        ),
        next => times(
            keys.length,
            (n, cb) => scalityUtils.waitWhileFailedCRR(srcBucket, keys[n], cb),
            next,
        ),
        next => timesSeries(
            keys.length,
            (n, cb) => scalityUtils.compareObjectsAWS(
                srcBucket,
                destFailBucket,
                keys[n],
                undefined,
                cb,
            ),
            next,
        ),
    ], done);
}

describe('Backbeat replication retry', function () {
    this.timeout(REPLICATION_TIMEOUT);
    const roleArn = 'arn:aws:iam::root:role/s3-replication-role';

    beforeEach(done => series([
        next => scalityUtils.createVersionedBucket(srcBucket, next),
        next => scalityUtils.putBucketReplicationMultipleBackend(
            srcBucket,
            destFailBucket,
            roleArn,
            destFailLocation,
            next,
        ),
    ], done));

    afterEach(done => parallel([
        next => scalityUtils.deleteVersionedBucket(srcBucket, next),
        next => awsUtils.deleteAllVersions(
            destFailBucket,
            `${srcBucket}/${keyPrefix}`,
            next,
        ),
    ], done));

    [1, 2, 128].forEach(N => {
        it(`should retry ${N} failed object(s)`, done => {
            // eslint-disable-next-line
            let versionId;
            // eslint-disable-next-line
            let postBody;
            const keys = [];
            for (let i = 0; i < N; i++) {
                keys.push(`${key}-${i}`);
            }
            return performRetries(keys, done);
        });
    });

    it('should get correct CRR metrics when a retry occurs', (done) => {
        this.retries(2); // Test is dependent on metrics not expiring.
        const path = `/_/backbeat/api/metrics/crr/${destFailLocation}`;
        let prevBacklog;
        let prevCompletions;
        let prevFailures;
        let prevPending;
        return series([
            next => makeGETRequest(path, (err, res) => {
                assert.ifError(err);
                assert.equal(res.statusCode, 200);
                getResponseBody(res, (err, body) => {
                    assert.ifError(err);
                    prevBacklog = body.backlog.results;
                    prevCompletions = body.completions.results;
                    prevFailures = body.failures.results;
                    prevPending = body.pending.results;
                    return next();
                });
            }),
            next => performRetries([key], next),
            next => {
                let shouldContinue = false;
                return doWhilst(
                    callback => makeGETRequest(path, (err, res) => {
                        assert.ifError(err);
                        assert.strictEqual(res.statusCode, 200);
                        getResponseBody(res, (err, body) => {
                            assert.ifError(err);
                            const { results } = body.completions;
                            // We have potentially reached an expiration of
                            // metrics. In this case, the test's retry should
                            // avoid continued failure since metrics expire only
                            // after fifteen minutes.
                            assert(
                                results.count >= prevCompletions.count,
                                'the completions result count was decremented',
                            );
                            // If the operation is still in the backlog,
                            // continue until the metric has been updated.
                            const delta = results.count - prevCompletions.count;
                            shouldContinue = delta === 0;
                            if (shouldContinue) {
                                return setTimeout(callback, 2000);
                            }
                            checkMetrics(
                                prevBacklog,
                                prevCompletions,
                                prevFailures,
                                prevPending,
                                body,
                            );
                            return callback();
                        });
                    }),
                    () => shouldContinue,
                    next,
                );
            },
        ], done);
    });
});
