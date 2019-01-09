const assert = require('assert');
const crypto = require('crypto');
const { series, parallel, timeSeries, each } = require('async');

const { scalityS3Client, awsS3Client } = require('../../../s3SDK');
// ReplicationUtility has a lot of general functions that are needed,
// such as: cleanup functions, putting objects, retrieving objects.
const ReplicationUtility = require('../../ReplicationUtility');

const srcBucket = process.env.
const ingBucket = `ingestion-bucket-${Date.now()}`;
const scalityUtils = new ReplicationUtility(scalityS3Client);
const awsUtils = new ReplicationUtility(awsS3Client);

describe('ingestion with RING and S3C', function() {
    this.timeout(REPLICATION_TIMEOUT);
    this.retries(3);

    beforeEach(done => scalityUtils.createIngestionBucket(ingBucket, done));

    afterEach(done => scalityUtils.deleteVersionedBucket(ingBucket, done));

    it('should ingest pre-existing objects', done => series([
        next => scalityUtils.compareObjectsS3C(srcBucket, ingBucket, key,
            undefined, next),
    ], done));

    it('should receive out-of-band updates', done => series([
        next => scalityUtils.putObject(srcBucket, key, undefined, next),
    ]));
});
