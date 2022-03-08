const assert = require('assert');
const crypto = require('crypto');
const {
    doWhilst, parallel, waterfall, series,
} = require('async');

const { scalityS3Client, awsS3Client } = require('../../../s3SDK');
const sharedBlobSvc = require('../../azureSDK');
const ReplicationUtility = require('../../ReplicationUtility');
const { makeGETRequest, getResponseBody, makePOSTRequest } = require('../../../utils/request');

const scalityUtils = new ReplicationUtility(scalityS3Client, sharedBlobSvc);
const awsUtils = new ReplicationUtility(awsS3Client);

const srcBucket = `source-bucket-${Date.now()}`;
const awsDestBucket = process.env.AWS_BACKBEAT_BUCKET_NAME;
const destAWSLocation = process.env.AWS_BACKEND_DESTINATION_LOCATION;
const destFailBucket = process.env.AWS_FAIL_BACKBEAT_BUCKET_NAME;
const destFailLocation = process.env.AWS_FAIL_BACKEND_DESTINATION_LOCATION;
const hex = crypto.createHash('md5')
    .update(Math.random().toString())
    .digest('hex');
const keyPrefix = `${srcBucket}/${hex}`;
const key = `${keyPrefix}/object-to-replicate-${Date.now()}`;
const destKeyPrefix = `${srcBucket}/${keyPrefix}`;

const REPLICATION_TIMEOUT = 300000;

function getAndCheckResponse(path, expectedResults, cb) {
    let shouldContinue = false;
    return doWhilst(
        next => makeGETRequest(path, (err, res) => {
            assert.ifError(err);
            assert.strictEqual(res.statusCode, 200);
            getResponseBody(res, (err, body) => {
                assert.ifError(err);
                shouldContinue = JSON.stringify(body)
                    !== JSON.stringify({
                        pending: {
                            description: 'Number of pending replication '
                                + 'operations (count) and bytes (size)',
                            results: expectedResults,
                        },
                    });
                if (shouldContinue) {
                    return setTimeout(next, 100);
                }
                return next();
            });
        }),
        () => shouldContinue,
        cb,
    );
}

function getPendingPath(location) {
    const pathPrefix = '/_/backbeat/api/metrics/crr';
    return `${pathPrefix}/${location}/pending`;
}

describe('Backbeat API pending metrics', () => {
    this.timeout(REPLICATION_TIMEOUT);
    const roleArn = 'arn:aws:iam::root:role/s3-replication-role';

    describe('Completed CRR', () => {
        const pendingPath = getPendingPath(destAWSLocation);

        before(done => series([
            next => scalityUtils.createVersionedBucket(srcBucket, next),
            next => scalityUtils.putBucketReplicationMultipleBackend(
                srcBucket,
                'placeholder',
                roleArn,
                destAWSLocation,
                next,
            ),
        ], done));

        after(done => series([
            next => awsUtils.deleteAllVersions(
                awsDestBucket,
                destKeyPrefix,
                next,
            ),
            next => scalityUtils.deleteVersionedBucket(srcBucket, next),
        ], done));

        it('should get pending bytes while CRR is in progress', done => waterfall([
            next => scalityUtils.completeMPUAWS(srcBucket, key, 10, next),
            (data, next) => getAndCheckResponse(
                pendingPath,
                { count: 1, size: 52428810 },
                next,
            ),
            next => scalityUtils.waitUntilReplicated(
                srcBucket,
                key,
                undefined,
                err => {
                    assert.ifError(err);
                    getAndCheckResponse(
                        pendingPath,
                        { count: 0, size: 0 },
                        next,
                    );
                },
            ),
        ], done));
    });

    describe('Failed CRR', () => {
        let postBody;
        const pendingPath = getPendingPath(destFailLocation);

        before(done => series([
            next => scalityUtils.createVersionedBucket(srcBucket, next),
            next => scalityUtils.putBucketReplicationMultipleBackend(
                srcBucket,
                destFailBucket,
                roleArn,
                destFailLocation,
                next,
            ),
        ], done));

        after(done => parallel([
            next => scalityUtils.deleteVersionedBucket(srcBucket, next),
            next => awsUtils.deleteAllVersions(
                destFailBucket,
                `${srcBucket}/${keyPrefix}`,
                next,
            ),
        ], done));

        it('should handle pending metrics', done => series([
            next => awsUtils.deleteVersionedBucket(destFailBucket, next),
            next => scalityUtils.completeMPUAWS(srcBucket, key, 10, next),
            next => getAndCheckResponse(
                pendingPath,
                { count: 1, size: 52428810 },
                next,
            ),
            next => scalityUtils.waitWhilePendingCRR(srcBucket, key, next),
            next => scalityUtils.getHeadObject(srcBucket, key, (err, data) => {
                if (err) {
                    return next(err);
                }
                const { ReplicationStatus, Metadata, VersionId } = data;
                // eslint-disable-next-line
                versionId = VersionId;
                assert.strictEqual(ReplicationStatus, 'FAILED');
                assert.strictEqual(
                    Metadata[`${destFailLocation}-replication-status`],
                    'FAILED',
                );
                return setTimeout(() => next(), 5000);
            }, next),
            next => getAndCheckResponse(
                pendingPath,
                { count: 0, size: 0 },
                next,
            ),
            next => makeGETRequest(
                '/_/backbeat/api/crr/failed',
                (err, res) => {
                    assert.ifError(err);
                    return getResponseBody(res, (err, body) => {
                        assert.ifError(err);
                        postBody = JSON.stringify(body.Versions);
                        next();
                    });
                },
            ),
            next => awsUtils.createVersionedBucket(destFailBucket, next),
            next => makePOSTRequest(
                '/_/backbeat/api/crr/failed',
                postBody,
                (err, res) => {
                    assert.ifError(err);
                    return getResponseBody(res, (err) => {
                        assert.ifError(err);
                        return next();
                    });
                },
            ),
            next => scalityUtils.waitUntilReplicated(
                srcBucket,
                key,
                undefined,
                next,
            ),
            next => getAndCheckResponse(
                pendingPath,
                { count: 0, size: 0 },
                next,
            ),
        ], done));
    });
});
