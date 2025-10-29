const async = require('async');

const { getS3Client } = require('../../../s3SDK');
const ReplicationUtility = require('../../ReplicationUtility');

const sourceInfo = JSON.parse(process.env.CRR_SOURCE_INFO);
const sourceS3 = getS3Client(
    sourceInfo.AccessKeyId,
    sourceInfo.SecretAccessKey,
    sourceInfo.SessionToken,
);

const destinationInfo = JSON.parse(process.env.CRR_DESTINATION_INFO);
const destinationS3 = getS3Client(
    destinationInfo.AccessKeyId,
    destinationInfo.SecretAccessKey,
    destinationInfo.SessionToken,
);

const srcUtil = new ReplicationUtility(sourceS3);
const destUtil = new ReplicationUtility(destinationS3);

const sourceLocation = process.env.CRR_SOURCE_LOCATION_NAME;
const destinationLocation = process.env.CRR_DESTINATION_LOCATION_NAME;

const roleName = process.env.CRR_ROLE_NAME;
const sourceRole = `arn:aws:iam::${sourceInfo.AccountId}:role/${roleName}`;
const destinationRole = `arn:aws:iam::${destinationInfo.AccountId}:role/${roleName}`;

describe('CRR', function () {
    this.timeout(300000);
    this.retries(3);

    let srcBucket;
    let destBucket;
    let key;

    beforeEach(done => {
        key = `crr-key-${Date.now()}`;
        srcBucket = `crr-source-bucket-${Date.now()}`;
        destBucket = `crr-destination-bucket-${Date.now()}`;
        async.series([
            next => srcUtil.createVersionedBucket(srcBucket, next),
            next => destUtil.createVersionedBucket(destBucket, next),
            next => srcUtil.putBucketReplication(
                srcBucket,
                destBucket,
                `${sourceRole},${destinationRole}`,
                destinationLocation,
                next,
            ),
        ], done);
    });

    afterEach(done => async.series([
        next => srcUtil.deleteBucketReplication(srcBucket, next),
        next => srcUtil.deleteVersionedBucket(srcBucket, next),
        next => destUtil.deleteVersionedBucket(destBucket, next),
    ], done));

    it('should replicate an object', done => async.series([
        next => srcUtil.putObjectWithUserMetadata(
            srcBucket,
            key,
            Buffer.alloc(1),
            next,
        ),
        next => srcUtil.compareObjectsCRR(
            srcBucket,
            destUtil,
            destBucket,
            key,
            'customKey',
            next,
        ),
    ], done));

    it('should replicate a zero byte object', done => async.series([
        next => srcUtil.putObjectWithUserMetadata(
            srcBucket,
            key,
            undefined,
            next,
        ),
        next => srcUtil.compareObjectsCRR(
            srcBucket,
            destUtil,
            destBucket,
            key,
            'customKey',
            next,
        ),
    ], done));

    it('should replicate delete markers', done => async.series([
        next => srcUtil.putObject(
            srcBucket,
            key,
            Buffer.alloc(1),
            next,
        ),
        next => srcUtil.compareObjectsCRR(
            srcBucket,
            destUtil,
            destBucket,
            key,
            undefined,
            next,
        ),
        next => srcUtil.deleteObject(
            srcBucket,
            key,
            null,
            next,
        ),
        next => destUtil.waitUntilDeleted(
            destBucket,
            key,
            's3',
            next,
        ),
    ], done));

    it('should not replicate hard deletes', done => async.waterfall([
        next => srcUtil.putObject(
            srcBucket,
            key,
            Buffer.alloc(1),
            (err, data) => next(err, data.VersionId),
        ),
        (versionID, next) => srcUtil.compareObjectsCRR(
            srcBucket,
            destUtil,
            destBucket,
            key,
            undefined,
            err => next(err, versionID),
        ),
        (versionID, next) => srcUtil.deleteObject(
            srcBucket,
            key,
            versionID,
            err => next(err),
        ),
        next => setTimeout(() => next(), 30000),
        next => destUtil.getHeadObject(
            destBucket,
            key,
            next,
        ),
    ], done));

    it('should replicate object tags', done => async.series([
        next => srcUtil.putObject(
            srcBucket,
            key,
            Buffer.alloc(1),
            next,
        ),
        next => srcUtil.compareObjectsCRR(
            srcBucket,
            destUtil,
            destBucket,
            key,
            undefined,
            next,
        ),
        next => srcUtil.putObjectTagging(
            srcBucket,
            key,
            undefined,
            next,
        ),
        next => srcUtil.compareObjectTagCRR(
            srcBucket,
            destUtil,
            destBucket,
            key,
            next,
        ),
    ], done));

    it('should replicate object ACL', done => async.series([
        next => srcUtil.putObject(
            srcBucket,
            key,
            Buffer.alloc(1),
            next,
        ),
        next => srcUtil.compareACLsCRR(
            srcBucket,
            destUtil,
            destBucket,
            key,
            next,
        ),
        next => srcUtil.putObjectACL(
            srcBucket,
            key,
            next,
        ),
        next => srcUtil.compareACLsCRR(
            srcBucket,
            destUtil,
            destBucket,
            key,
            next,
        ),
    ], done));

    it('should replicate a version on top of an existing version', done => async.series([
        next => destUtil.putObject(
            destBucket,
            key,
            Buffer.alloc(1),
            next,
        ),
        next => srcUtil.putObject(
            srcBucket,
            key,
            Buffer.alloc(2),
            next,
        ),
        next => srcUtil.compareObjectsCRR(
            srcBucket,
            destUtil,
            destBucket,
            key,
            undefined,
            next,
        ),
        next => destUtil.assertVersionCount(
            destBucket,
            2,
            next,
        ),
    ], done));

    // TODO: Unskip after CLDSRV-632
    it.skip('should replicate version on top of a null version', done => async.series([
        next => destUtil.putBucketVersioning(
            destBucket,
            'Suspended',
            next,
        ),
        next => destUtil.putObject(
            destBucket,
            key,
            Buffer.alloc(1),
            next,
        ),
        next => destUtil.putBucketVersioning(
            destBucket,
            'Enabled',
            next,
        ),
        next => srcUtil.putObject(
            srcBucket,
            key,
            Buffer.alloc(2),
            next,
        ),
        next => srcUtil.compareObjectsCRR(
            srcBucket,
            destUtil,
            destBucket,
            key,
            undefined,
            next,
        ),
        next => destUtil.assertVersionCount(
            destBucket,
            2,
            next,
        ),
    ], done));
});

describe('CRR Active-Active', function () {
    this.timeout(300000);
    this.retries(3);

    let srcBucket;
    let destBucket;
    let key;

    beforeEach(done => {
        key = `crr-active-active-key-${Date.now()}`;
        srcBucket = `crr-active-active-source-bucket-${Date.now()}`;
        destBucket = `crr-active-active-destination-bucket-${Date.now()}`;
        async.series([
            next => srcUtil.createVersionedBucket(srcBucket, next),
            next => destUtil.createVersionedBucket(destBucket, next),
            next => srcUtil.putBucketReplication(
                srcBucket,
                destBucket,
                `${sourceRole},${destinationRole}`,
                destinationLocation,
                next,
            ),
            next => destUtil.putBucketReplication(
                destBucket,
                srcBucket,
                `${destinationRole},${sourceRole}`,
                sourceLocation,
                next,
            ),
        ], done);
    });

    afterEach(done => async.series([
        next => srcUtil.deleteBucketReplication(srcBucket, next),
        next => destUtil.deleteBucketReplication(destBucket, next),
        next => srcUtil.deleteVersionedBucket(srcBucket, next),
        next => destUtil.deleteVersionedBucket(destBucket, next),
    ], done));

    it('should replicate back version from destination to source', done => async.series([
        next => srcUtil.putObject(
            srcBucket,
            key,
            Buffer.alloc(1),
            next,
        ),
        next => srcUtil.compareObjectsCRR(
            srcBucket,
            destUtil,
            destBucket,
            key,
            undefined,
            next,
        ),
        next => destUtil.putObject(
            destBucket,
            key,
            Buffer.alloc(2),
            next,
        ),
        next => destUtil.compareObjectsCRR(
            destBucket,
            srcUtil,
            srcBucket,
            key,
            undefined,
            next,
        ),
    ], done));

    it('should replicate tags to source bucket when they get updated on the destination bucket', done => async.series([
        next => srcUtil.putObject(
            srcBucket,
            key,
            Buffer.alloc(1),
            next,
        ),
        next => srcUtil.compareObjectsCRR(
            srcBucket,
            destUtil,
            destBucket,
            key,
            undefined,
            next,
        ),
        next => destUtil.putObjectTagging(
            destBucket,
            key,
            undefined,
            next,
        ),
        next => destUtil.compareObjectsCRR(
            destBucket,
            srcUtil,
            srcBucket,
            key,
            undefined,
            next,
        ),
        next => destUtil.compareObjectTagCRR(
            destBucket,
            srcUtil,
            srcBucket,
            key,
            next,
        ),
    ], done));

    it('should replicate ACLs to source bucket when they get updated on the destination bucket', done => async.series([
        next => srcUtil.putObject(
            srcBucket,
            key,
            Buffer.alloc(1),
            next,
        ),
        next => srcUtil.compareObjectsCRR(
            srcBucket,
            destUtil,
            destBucket,
            key,
            undefined,
            next,
        ),
        next => destUtil.putObjectACL(
            destBucket,
            key,
            next,
        ),
        next => srcUtil.compareACLsCRR(
            srcBucket,
            destUtil,
            destBucket,
            key,
            next,
        ),
    ], done));
});

