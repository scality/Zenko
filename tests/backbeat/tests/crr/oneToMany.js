const assert = require('assert');
const crypto = require('crypto');
const { series, parallel } = require('async');

const { scalityS3Client, awsS3Client } = require('../../s3SDK');
const sharedBlobSvc = require('../../azureSDK');
const gcpStorage = require('../../gcpStorage');
const ReplicationUtility = require('../../ReplicationUtility');

const utils =
    new ReplicationUtility(scalityS3Client, sharedBlobSvc, gcpStorage);
const awsUtils = new ReplicationUtility(awsS3Client);
const srcBucket = `source-bucket-${Date.now()}`;
const awsDestBucket = process.env.AWS_S3_BACKBEAT_BUCKET_NAME;
const destContainer = process.env.AZURE_BACKBEAT_CONTAINER_NAME;
const gcpDestBucket = process.env.GCP_CRR_BUCKET_NAME;
const destAWSLocation = process.env.AWS_S3_BACKEND_DESTINATION_LOCATION;
const destAzureLocation = process.env.AZURE_BACKEND_DESTINATION_LOCATION;
const destGCPLocation = process.env.GCP_BACKEND_DESTINATION_LOCATION;
const hex = crypto.createHash('md5')
    .update(Math.random().toString())
    .digest('hex');
const keyPrefix = `${srcBucket}/${hex}`;
const destKeyPrefix = `${srcBucket}/${keyPrefix}`;
const key = `${keyPrefix}/object-to-replicate-${Date.now()}`;
const copyKey = `${key}-copy`;
const copySource = `/${srcBucket}/${key}`;
const REPLICATION_TIMEOUT = 300000;

describe('Replication with AWS, Azure, and GCP backends (one-to-many)',
function() {
    this.timeout(REPLICATION_TIMEOUT);
    const roleArn = 'arn:aws:iam::root:role/s3-replication-role';
    const storageClass =
        `${destAWSLocation},${destAzureLocation},${destGCPLocation}`;

    beforeEach(done => series([
        next => utils.createVersionedBucket(srcBucket, next),
        next => utils.putBucketReplicationMultipleBackend(srcBucket,
            'placeholder', roleArn, storageClass, next),
    ], done));

    afterEach(done => series([
        next => awsUtils.deleteAllVersions(awsDestBucket, destKeyPrefix, next),
        next => utils.deleteAllBlobs(destContainer, destKeyPrefix, next),
        next => utils.deleteAllFiles(gcpDestBucket, destKeyPrefix, next),
        next => utils.deleteVersionedBucket(srcBucket, next),
    ], done));

    it('should replicate an object', done => series([
        next => utils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => utils.compareObjectsOneToMany(srcBucket, awsDestBucket,
            destContainer, gcpDestBucket, key, next),
    ], done));

    it('should replicate a zero byte object', done => series([
        next => utils.putObject(srcBucket, key, undefined, next),
        next => utils.compareObjectsOneToMany(srcBucket, awsDestBucket,
            destContainer, gcpDestBucket, key, next),
    ], done));

    it('should replicate a copied object', done => series([
        next => utils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => utils.copyObject(srcBucket, copySource, copyKey, next),
        next => utils.compareObjectsOneToMany(srcBucket, awsDestBucket,
            destContainer, gcpDestBucket, copyKey, next),
        // Avoid a race with cleanup by ensuring everything is replicated.
        next => utils.waitUntilReplicated(srcBucket, key, undefined, next),
    ], done));

    it('should replicate a MPU object: 2 parts', done => series([
        next => utils.completeMPUAWS(srcBucket, key, 2, next),
        next => utils.compareObjectsOneToMany(srcBucket, awsDestBucket,
            destContainer, gcpDestBucket, key, next),
    ], done));

    it('should replicate a MPU object: 10 parts', done => series([
        next => utils.completeMPUAWS(srcBucket, key, 10, next),
        next => utils.compareObjectsOneToMany(srcBucket, awsDestBucket,
            destContainer, gcpDestBucket, key, next),
    ], done));

    [undefined,
    `0-${1024 * 1024 * 5}`,
    `${1024 * 1024 * 2}-${1024 * 1024 * 7}`].forEach(range =>
        it('should replicate a MPU with parts copied from another MPU with ' +
        `byte range '${range}' for each part`, done => series([
            next => utils.completeMPUAWS(srcBucket, key, 2, next),
            next => utils.completeMPUWithPartCopy(srcBucket, copyKey,
                copySource, range, 2, next),
            next => utils.compareObjectsOneToMany(srcBucket, awsDestBucket,
                destContainer, gcpDestBucket, copyKey, next),
            // avoid a race with cleanup by ensuring everything is replicated
            next => utils.waitUntilReplicated(srcBucket, key, undefined, next),
        ], done)));
});
