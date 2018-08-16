const assert = require('assert');
const crypto = require('crypto');
const uuid = require('uuid/v4');
const { series, parallel } = require('async');

const { scalityS3Client, awsS3Client } = require('../../../s3SDK');
const sharedBlobSvc = require('../../azureSDK');
const gcpStorage = require('../../gcpStorage');
const ReplicationUtility = require('../../ReplicationUtility');

const utils =
    new ReplicationUtility(scalityS3Client, sharedBlobSvc, gcpStorage);
const awsUtils = new ReplicationUtility(awsS3Client);
const awsDestBucket = process.env.AWS_S3_BACKBEAT_BUCKET_NAME;
const destContainer = process.env.AZURE_BACKBEAT_CONTAINER_NAME;
const gcpDestBucket = process.env.GCP_CRR_BUCKET_NAME;
const destAWSLocation = process.env.AWS_S3_BACKEND_DESTINATION_LOCATION;
const destAzureLocation = process.env.AZURE_BACKEND_DESTINATION_LOCATION;
const destGCPLocation = process.env.GCP_BACKEND_DESTINATION_LOCATION;
const hex = crypto.createHash('md5')
    .update(Math.random().toString())
    .digest('hex');
const REPLICATION_TIMEOUT = 300000;


describe('Replication with AWS, Azure, and GCP backends (one-to-many)',
function() {
    this.timeout(REPLICATION_TIMEOUT);
    this.retries(3);
    const roleArn = 'arn:aws:iam::root:role/s3-replication-role';
    const storageClass =
        `${destAWSLocation},${destAzureLocation},${destGCPLocation}`;

    beforeEach(function beforeEachF(done) {
        this.currentTest.srcBucket =
            `source-bucket-${uuid().replace(/-/g, '')}`;
        this.currentTest.keyPrefix =
            `${this.currentTest.srcBucket}/${hex}`;
        this.currentTest.destKeyPrefix =
            `${this.currentTest.srcBucket}/${this.currentTest.keyPrefix}`;
        this.currentTest.key =
            `${this.currentTest.keyPrefix}/object-to-replicate-` +
            `${uuid().replace(/-/g, '')}`;
        this.currentTest.copyKey = `${this.currentTest.key}-copy`;
        this.currentTest.copySource = `/${this.currentTest.srcBucket}/` +
            `${this.currentTest.key}`;
        return series([
            next => utils.createVersionedBucket(
                this.currentTest.srcBucket, next),
            next => utils.putBucketReplicationMultipleBackend(
                this.currentTest.srcBucket, 'placeholder', roleArn,
                storageClass, next),
        ], done);
    });

    afterEach(function afterEachF(done) {
        return series([
            next => awsUtils.deleteAllVersions(awsDestBucket,
                this.currentTest.destKeyPrefix, next),
            next => utils.deleteAllBlobs(destContainer,
                this.currentTest.destKeyPrefix, next),
            next => utils.deleteAllFiles(gcpDestBucket,
                this.currentTest.destKeyPrefix, next),
            next => utils.deleteVersionedBucket(
                this.currentTest.srcBucket, next),
        ], done);
    });

    it('should replicate an object',function itF(done) {
        return series([
            next => utils.putObject(this.test.srcBucket, this.test.key,
                Buffer.alloc(1), next),
            next => utils.compareObjectsOneToMany(this.test.srcBucket,
                awsDestBucket, destContainer, gcpDestBucket,
                this.test.key, next),
        ], done);
    });

    it('should replicate a zero byte object', function itF(done) {
        return series([
            next => utils.putObject(this.test.srcBucket, this.test.key,
                undefined, next),
            next => utils.compareObjectsOneToMany(this.test.srcBucket,
                awsDestBucket, destContainer, gcpDestBucket,
                this.test.key, next),
        ], done);
    });

    it('should replicate a copied object', function itF(done) {
        return series([
            next => utils.putObject(this.test.srcBucket, this.test.key,
                Buffer.alloc(1), next),
            next => utils.copyObject(this.test.srcBucket,
                this.test.copySource, this.test.copyKey, next),
            next => utils.compareObjectsOneToMany(this.test.srcBucket,
                awsDestBucket,
                destContainer, gcpDestBucket, this.test.copyKey, next),
            // Avoid a race with cleanup by ensuring everything is 
            // replicated.
            next => utils.waitUntilReplicated(this.test.srcBucket,
                this.test.key, undefined, next),
        ], done);
    });

    it('should replicate a MPU object: 2 parts', function itF(done) {
        return series([
            next => utils.completeMPUAWS(this.test.srcBucket,
                this.test.key, 2, next),
            next => utils.compareObjectsOneToMany(this.test.srcBucket,
                awsDestBucket,
                destContainer, gcpDestBucket, this.test.key, next),
        ], done);
    });

    it('should replicate a MPU object: 10 parts', function itF(done) {
        return series([
            next => utils.completeMPUAWS(this.test.srcBucket,
                this.test.key, 10, next),
            next => utils.compareObjectsOneToMany(this.test.srcBucket,
                awsDestBucket, destContainer, gcpDestBucket,
                this.test.key, next),
        ], done);
    });

    [undefined,
    `0-${1024 * 1024 * 5}`,
    `${1024 * 1024 * 2}-${1024 * 1024 * 7}`].forEach(range =>
        it.skip('should replicate a MPU with parts copied from another MPU ' +
        `with byte range '${range}' for each part`, function itF(done) {
            return series([
                next => utils.completeMPUAWS(this.test.srcBucket,
                    this.test.key, 2, next),
                next => utils.completeMPUWithPartCopy(this.test.srcBucket,
                    this.test.copyKey, this.test.copySource, range, 2,
                    next),
                next => utils.compareObjectsOneToMany(this.test.srcBucket,
                    awsDestBucket, destContainer, gcpDestBucket,
                    this.test.copyKey, next),
                // avoid a race with cleanup by ensuring everything is
                //replicated
                next => utils.waitUntilReplicated(this.test.srcBucket,
                    this.test.key, undefined, next),
            ], done);
        }));
});
