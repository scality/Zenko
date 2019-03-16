const assert = require('assert');
const crypto = require('crypto');
const request = require('request');
const { series, waterfall, doWhilst } = require('async');

const { scalityS3Client, awsS3Client } = require('../../../s3SDK');
const ReplicationUtility = require('../../ReplicationUtility');
const { makeGETRequest, getResponseBody } = require('../../../utils/request');

const scalityUtils = new ReplicationUtility(scalityS3Client);
const awsUtils = new ReplicationUtility(awsS3Client);
const srcBucket = `source-bucket-${Date.now()}`;
const destBucket = process.env.AWS_CRR_BUCKET_NAME;
const destLocation = process.env.AWS_BACKEND_DESTINATION_LOCATION;
const hex = crypto.createHash('md5')
    .update(Math.random().toString())
    .digest('hex');
const keyPrefix = `${srcBucket}/${hex}`;
const key = `${keyPrefix}/object-to-replicate-${Date.now()}`;
const REPLICATION_TIMEOUT = 600000;

function getAndCheckResponse(path, expectedBody, cb) {
    let shouldContinue = false;
    return doWhilst(next =>
        makeGETRequest(path, (err, res) => {
            if (err) {
                return next(err);
            }
            assert.strictEqual(res.statusCode, 200);
            return getResponseBody(res, (err, body) => {
                if (err) {
                    return next(err);
                }
                shouldContinue =
                    JSON.stringify(body) !== JSON.stringify(expectedBody);
                return setTimeout(next, 2000);
            });
        }),
    () => shouldContinue, cb);
}

describe.only('Backbeat object monitor CRR metrics', function() {
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

    it('should monitor a 1 byte object', done => waterfall([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next),
        (data, next) =>
            scalityUtils.waitUntilReplicated(srcBucket, key, undefined, err =>
                next(err, data)),
        (data, next) => {
            const path = `/_/backbeat/api/metrics/crr/${destLocation}` +
                `/progress/${srcBucket}/${key}?versionId=${data.VersionId}`;
            const expectedBody = {
                description: 'Number of bytes to be replicated (pending), ' +
                    'number of bytes transferred to the destination ' +
                    '(completed), and percentage of the object that has ' +
                    'completed replication (progress)',
                pending: 0,
                completed: 1,
                progress: '100%',
            };
            return getAndCheckResponse(path, expectedBody, next);
        },
    ], done));

    it('should monitor part uploads of an MPU object', done => waterfall([
        next => scalityUtils.completeMPUAWS(srcBucket, key, 50, next),
        (data, next) => {
            const path = `/_/backbeat/api/metrics/crr/${destLocation}` +
                `/progress/${srcBucket}/${key}?versionId=${data.VersionId}`;
            const responses = [];
            let progress = '0%';
            return doWhilst(callback =>
                makeGETRequest(path, (err, res) => {
                    if (err) {
                        return callback(err);
                    }
                    assert.strictEqual(res.statusCode, 200);
                    return getResponseBody(res, (err, body) => {
                        if (err) {
                            return callback(err);
                        }
                        progress = body.progress;
                        responses.push(body);
                        return setTimeout(callback, 50);
                    });
                }),
            () => (progress !== '100%'), err => {
                if (err) {
                    return next(err);
                }
                // Fifty part object of 5MB + 1B parts.
                const contentLength = (((1024 * 1024) * 5) + 1) * 50;
                const firstResponse = responses[0];
                assert.strictEqual(firstResponse.pending, 0);
                assert.strictEqual(firstResponse.completed, 0);
                assert.strictEqual(firstResponse.progress, '0%');
                // Check that monitoring has tracked parts of the MPU.
                const hasInterval = responses.some(response => {
                    const { pending, completed } = response;
                    const percentage =
                        Number.parseInt(response.progress.split('%')[0], 10);
                    const hasInterval =
                        (pending > 0 && pending < contentLength) &&
                        (completed > 0 && completed < contentLength) &&
                        (percentage > 0 && percentage < 100);
                    return hasInterval;
                });
                assert.strictEqual(hasInterval, true);
                const finalResponse = responses[responses.length - 1];
                assert.strictEqual(finalResponse.pending, 0);
                assert.strictEqual(finalResponse.completed, contentLength);
                assert.strictEqual(finalResponse.progress, '100%');
                return next();
            });
        },
        // wait for metadata to update
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
            next),
    ], done));

    it('should monitor the average throughput for a 10 byte object', done => {
         // Use a new key since we don't want to track the previous operations.
        const throughputKey = `${key}-throughput`;
        return waterfall([
            next =>
                scalityUtils.putObject(srcBucket, throughputKey,
                    Buffer.alloc(10), next),
            (data, next) =>
                scalityUtils.waitUntilReplicated(srcBucket, throughputKey,
                    undefined, err => next(err, data)),
            (data, next) => {
                const path = `/_/backbeat/api/metrics/crr/${destLocation}` +
                    `/throughput/${srcBucket}/${throughputKey}` +
                    `?versionId=${data.VersionId}`;
                const expectedBody = {
                    description: 'Current throughput for object replication ' +
                        'in bytes/sec (throughput)',
                    throughput: '0.01',
                };
                return getAndCheckResponse(path, expectedBody, next);
            },
        ], done);
    });
});
