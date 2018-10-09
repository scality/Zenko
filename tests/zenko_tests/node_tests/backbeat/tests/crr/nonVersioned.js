const assert = require('assert');
const crypto = require('crypto');
const { series, parallel, timesSeries, each, eachLimit, eachSeries } = require('async');

const { scalityS3Client, awsS3Client } = require('../../s3SDK');
const ReplicationUtility = require('../../ReplicationUtility');

const scalityUtils = new ReplicationUtility(scalityS3Client);
const awsUtils = new ReplicationUtility(awsS3Client);
const srcBucket = 'nfs-bucket';
const destBucket = process.env.AWS_S3_BACKBEAT_BUCKET_NAME;
const destLocation = process.env.AWS_LOCATION;
const roleName = `RoleForReplication-${Date.now()}`;
const hex = crypto.createHash('md5')
    .update(Math.random().toString())
    .digest('hex');
const keyPrefix = `${srcBucket}/${hex}`;
const key = `${keyPrefix}/object-to-replicate-${Date.now()}`;
const copyKey = `${key}-copy`;
const copySource = `/${srcBucket}/${key}`;
const REPLICATION_TIMEOUT = 3000000;

const sizes = Array.from(Array(10).keys());

describe('Replication with AWS backend using NFS bucket', function() {
    this.timeout(REPLICATION_TIMEOUT);
    let policyArn;
    let roleArn;

    beforeEach(done => series([
        next => scalityUtils.createVersionedBucket(srcBucket, next),
        next => scalityUtils.putBucketReplicationMultipleBackend(srcBucket,
            destBucket, roleArn, destLocation, next),
    ], done));

    afterEach(done => series([
        next => scalityUtils.deleteVersionedBucket(srcBucket, next),
        // Destination location has falsy bucket match property, so we update
        // the key prefix.
        next => awsUtils.deleteAllVersions(destBucket,
            `${srcBucket}/${keyPrefix}`, next),
    ], done));

    it('should replicate an object of same size with different content', done => series([
        next => scalityUtils.putObject(srcBucket, key, 'ab', next),
        next => scalityUtils.putObject(srcBucket, key, 'bb', next),
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
            next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    it('should replicate an object when last size is 0', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(0), next),
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
            next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    it('should put a large object then delete it while stream is transferred', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1024 * 1024 * 1024), next),
        next => {
            setTimeout(function () {
                scalityUtils.deleteObject(srcBucket, key, null, next);
            }, 30000);
        },
    ], done));

    it('should replicate an object when first size is 0 many objects', done => series([
        next => eachLimit(sizes, 10, (size, done) => {
            scalityUtils.putObject(srcBucket, key, Buffer.alloc(size), done);
        }, next),
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
            next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    it('should replicate an object when last size is 0', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(0), next),
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
            next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    it('should replicate a copied object', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(0), next),
        next => scalityUtils.copyObject(srcBucket, copySource, copyKey, next),
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => scalityUtils.copyObject(srcBucket, copySource, copyKey, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, copyKey,
            undefined, next),
        // avoid a race with cleanup by ensuring everything is replicated
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
                                                 next),
    ], done));

    it('should replicate a copied object many objects', done => series([
        next => eachSeries(sizes, (size, done) => {
            series([
                cb => scalityUtils.putObject(srcBucket, key, Buffer.alloc(size), cb),
                cb => scalityUtils.copyObject(srcBucket, copySource, copyKey, cb),
            ], done);
        }, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, copyKey,
            undefined, next),
        // avoid a race with cleanup by ensuring everything is replicated
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
                                                 next),
    ], done));

    it('should replicate a MPU object: single 0 byte part', done => series([
        next => scalityUtils.completeSinglePartMPU(srcBucket, key, 0, next),
        next => scalityUtils.completeSinglePartMPU(srcBucket, key, 1, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    it('should replicate a MPU object: single byte part many objects', done => series([
        next => eachSeries(sizes, (size, done) => {
            scalityUtils.completeSinglePartMPU(srcBucket, key, size, done);
        }, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    it('should replicate a MPU object: 2 parts', done => series([
        next => scalityUtils.completeMPUAWS(srcBucket, key, 2, next),
        next => scalityUtils.completeMPUAWS(srcBucket, key, 3, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    const mpuSizes = Array.from(Array(3).keys());
    it('should replicate a MPU object: many parts, many objects', done => series([
        next => eachSeries(mpuSizes, (size, done) => {
            series([
                cb => scalityUtils.completeMPUAWS(srcBucket, key, size + 100, cb),
            ], done);
        }, next),
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
                                                 next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    it('should replicate a MPU object: many parts, then delete', done => series([
        next => scalityUtils.completeMPUAWS(srcBucket, key, 50, next),
        next => {
            setTimeout(function () {
                scalityUtils.deleteObject(srcBucket, key, null, next);
            }, 35000);
        },
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
                                                 next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    it('should replicate a MPU object: many parts, then put 1 byte object', done => series([
        next => scalityUtils.completeMPUAWS(srcBucket, key, 50, next),
        next => {
            setTimeout(function () {
                scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next);
            }, 30000);
        },
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
                                                 next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    const range1 = `0-${1024 * 1024 * 5}`;
    const range2 = `${1024 * 1024 * 2}-${1024 * 1024 * 7 + 1}`;

    it('should replicate a MPU with parts copied from another MPU with ' +
    `byte range '${range2}' for each part`, done => series([
        next => scalityUtils.completeMPUAWS(srcBucket, key, 2, next),
        next => scalityUtils.completeMPUWithPartCopy(srcBucket, copyKey,
            copySource, range1, 2, next),
        next => scalityUtils.completeMPUWithPartCopy(srcBucket, copyKey,
            copySource, range2, 2, next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket,
            copyKey, undefined, next),
        // avoid a race with cleanup by ensuring everything is replicated
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
                                                 next),
    ], done));

    it('should replicate an object delete marker', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(0), next),
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
            next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
        next => scalityUtils.deleteObject(srcBucket, key, null, next),
        next => awsUtils.waitUntilDeleted(destBucket, key, 's3', next),
        next => awsUtils.assertNoObject(destBucket, key, next),
    ], done));

    it('should replicate an object delete marker, but put the object again', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(0), next),
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
            next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
        next => scalityUtils.deleteObject(srcBucket, key, null, next),
        next => awsUtils.waitUntilDeleted(destBucket, key, 's3', next),
        next => awsUtils.assertNoObject(destBucket, key, next),
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
            next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    it('should not replicate a deleted object', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => scalityUtils.deleteObject(srcBucket, key, null, next),
        next => scalityUtils.assertNoObject(srcBucket, key, next),
        next => awsUtils.waitUntilDeleted(destBucket, key, 's3', next),
        next => awsUtils.assertNoObject(destBucket, key, next),
    ], done));

    it('should not replicate a non-deleted object', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(0), next),
        next => scalityUtils.deleteObject(srcBucket, key, null, next),
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
            next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    it('should not replicate a non-deleted object many objects', done => series([
        next => eachSeries(sizes, (size, done) => {
            series([
                cb => scalityUtils.putObject(srcBucket, key, Buffer.alloc(size), cb),
                cb => scalityUtils.deleteObject(srcBucket, key, null, cb),
                cb => scalityUtils.putObject(srcBucket, key, Buffer.alloc(size + 1), cb),
            ], done);
        }, next),
        next => scalityUtils.waitUntilReplicated(srcBucket, key, undefined,
            next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
    ], done));

    it('should replicate object tags of the latest version', done => series([
        next => scalityUtils.putObject(srcBucket, key, Buffer.alloc(1), next),
        next => scalityUtils.compareObjectsAWS(srcBucket, destBucket, key,
            undefined, next),
        next => scalityUtils.putObjectTagging(srcBucket, key, undefined, next),
        next => scalityUtils.compareObjectTagsAWS(srcBucket, destBucket, key,
            undefined, undefined, next),
    ], done));
});