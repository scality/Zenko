const async = require('async');
const uuid = require('uuid/v4');

const { scalityS3Client, ringS3Client, awsS3Client } = require('../../../s3SDK');
const IngestionUtility = require('../../IngestionUtility');
const ReplicationUtility = require('../../ReplicationUtility');
// utils
const scalityUtils = new IngestionUtility(scalityS3Client, ringS3Client);
const ringS3CUtils = new IngestionUtility(ringS3Client);
const awsUtils = new ReplicationUtility(awsS3Client);
// ingestion specific constants
const INGESTION_SOURCE_BUCKET = process.env.RING_S3C_INGESTION_SRC_BUCKET_NAME;
const INGESTION_LOCATION = process.env.RING_S3C_BACKEND_SOURCE_LOCATION;
const INGESTION_SOURCE_BUCKET_NON_VERSIONED = process.env.RING_S3C_INGESTION_SRC_BUCKET_NAME_NON_VERSIONED;
const INGESTION_LOCATION_NON_VERSIONED = process.env.RING_S3C_BACKEND_SOURCE_LOCATION_NON_VERSIONED;
let INGESTION_DESTINATION_BUCKET;
let INGESTION_DESTINATION_BUCKET_NON_VERSIONED;
// replication specific constants
const REPLICATION_DESTINATION_BUCKET = process.env.AWS_CRR_BUCKET_NAME;
const REPLICATION_LOCATION = process.env.AWS_BACKEND_DESTINATION_LOCATION;
const ROLE_ARN = 'arn:aws:iam::root:role/s3-replication-role';
// object specific constants
let KEY_PREFIX;
let OBJ_KEY;
const OBJ_KEY_NON_VERSIONED = process.env.RING_S3C_OBJECT_KEY_NON_VERSIONED;
const OBJ_KEY_ZERO_BYTE_NON_VERSIONED = process.env.RING_S3C_OBJECT_KEY_ZERO_BYTE_NON_VERSIONED;

describe('replication of versioned objects in OOB buckets', () => {

    beforeEach(done => {
        INGESTION_DESTINATION_BUCKET = `dst-bckt-versioned-${uuid()}`;
        KEY_PREFIX = `${INGESTION_SOURCE_BUCKET}-${uuid()}`;
        OBJ_KEY = `${KEY_PREFIX}/object-to-ingest-${uuid()}`;
        async.series([
            next => scalityUtils.createIngestionBucket(
                INGESTION_DESTINATION_BUCKET,
                INGESTION_LOCATION,
                REPLICATION_DESTINATION_BUCKET,
                REPLICATION_LOCATION,
                ROLE_ARN,
                next,
            ),
            next => this.putBucketReplicationMultipleBackend(
                INGESTION_DESTINATION_BUCKET,
                REPLICATION_DESTINATION_BUCKET,
                ROLE_ARN,
                REPLICATION_LOCATION,
                next,
            ),
        ], done);
    });

    afterEach(done => async.series([
        next => ringS3CUtils.deleteAllVersions(
            INGESTION_SOURCE_BUCKET,
            null,
            next,
        ),
        next => scalityUtils.waitUntilEmpty(
            INGESTION_DESTINATION_BUCKET,
            next,
        ),
    ], done));

    after(done => async.series([
        next => scalityUtils.deleteVersionedBucket(
            INGESTION_DESTINATION_BUCKET,
            next,
        ),
        next => awsUtils.deleteAllVersions(
            REPLICATION_DESTINATION_BUCKET,
            `${INGESTION_SOURCE_BUCKET}/${KEY_PREFIX}`,
            next,
        ),
    ], done));

    it('should replicate a zero byte OOB object', done => async.waterfall([

        next => ringS3CUtils.putObject(
            INGESTION_SOURCE_BUCKET,
            OBJ_KEY,
            undefined,
            next,
        ),
        (objData, next) => scalityUtils.waitUntilIngested(
            INGESTION_DESTINATION_BUCKET,
            OBJ_KEY,
            objData.versionId,
            next,
        ),
        next => scalityUtils.compareObjectsAWS(
            INGESTION_DESTINATION_BUCKET,
            REPLICATION_DESTINATION_BUCKET,
            OBJ_KEY,
            undefined,
            next,
        ),
    ], done));

    it('should replicate OOB object', done => async.waterfall([
        next => scalityUtils.createIngestionBucketWithReplication(
            INGESTION_DESTINATION_BUCKET,
            INGESTION_LOCATION,
            REPLICATION_DESTINATION_BUCKET,
            REPLICATION_LOCATION,
            ROLE_ARN,
            next,
        ),
        next => ringS3CUtils.putObject(
            INGESTION_SOURCE_BUCKET,
            OBJ_KEY,
            Buffer.alloc(1),
            next,
        ),
        (objData, next) => scalityUtils.waitUntilIngested(
            INGESTION_DESTINATION_BUCKET,
            OBJ_KEY,
            objData.versionId,
            next,
        ),
        next => scalityUtils.compareObjectsAWS(
            INGESTION_DESTINATION_BUCKET,
            REPLICATION_DESTINATION_BUCKET,
            OBJ_KEY,
            undefined,
            next,
        ),
    ], done));

    it('should replicate a MPU OOB object: single 0 byte part', done => async.waterfall([
        next => scalityUtils.createIngestionBucketWithReplication(
            INGESTION_DESTINATION_BUCKET,
            INGESTION_LOCATION,
            REPLICATION_DESTINATION_BUCKET,
            REPLICATION_LOCATION,
            ROLE_ARN,
            next,
        ),
        next => ringS3CUtils.completeSinglePartMPU(
            INGESTION_SOURCE_BUCKET,
            OBJ_KEY,
            0,
            next,
        ),
        (objData, next) => scalityUtils.waitUntilIngested(
            INGESTION_DESTINATION_BUCKET,
            OBJ_KEY,
            objData.versionId,
            next,
        ),
        next => scalityUtils.compareObjectsAWS(
            INGESTION_DESTINATION_BUCKET,
            REPLICATION_DESTINATION_BUCKET,
            OBJ_KEY,
            undefined,
            next,
        ),
    ], done));

    it('should replicate a MPU OOB object: single 1 byte part', done => async.waterfall([
        next => scalityUtils.createIngestionBucketWithReplication(
            INGESTION_DESTINATION_BUCKET,
            INGESTION_LOCATION,
            REPLICATION_DESTINATION_BUCKET,
            REPLICATION_LOCATION,
            ROLE_ARN,
            next,
        ),
        next => ringS3CUtils.completeSinglePartMPU(
            INGESTION_SOURCE_BUCKET,
            OBJ_KEY,
            1,
            next,
        ),
        (objData, next) => scalityUtils.waitUntilIngested(
            INGESTION_DESTINATION_BUCKET,
            OBJ_KEY,
            objData.versionId,
            next,
        ),
        next => scalityUtils.compareObjectsAWS(
            INGESTION_DESTINATION_BUCKET,
            REPLICATION_DESTINATION_BUCKET,
            OBJ_KEY,
            undefined,
            next,
        ),
    ], done));

    it('should replicate a MPU OOB object: single 10 byte part', done => async.waterfall([
        next => scalityUtils.createIngestionBucketWithReplication(
            INGESTION_DESTINATION_BUCKET,
            INGESTION_LOCATION,
            REPLICATION_DESTINATION_BUCKET,
            REPLICATION_LOCATION,
            ROLE_ARN,
            next,
        ),
        next => ringS3CUtils.completeMPUAWS(
            INGESTION_SOURCE_BUCKET,
            OBJ_KEY,
            10,
            next,
        ),
        (objData, next) => scalityUtils.waitUntilIngested(
            INGESTION_DESTINATION_BUCKET,
            OBJ_KEY,
            objData.versionId,
            next,
        ),
        next => scalityUtils.compareObjectsAWS(
            INGESTION_DESTINATION_BUCKET,
            REPLICATION_DESTINATION_BUCKET,
            OBJ_KEY,
            undefined,
            next,
        ),
    ], done));
});

// In order to have non versioned objects in the s3c oob bucket,
// objects need to be addded before setting the S3C bucket as
// a location in zenko, as the location has to be versioned.
// this is handled in the "configure e3e" step where we create
// the non versioned bucket, add objects and then activate the
// versioning
describe('replication of non versioned objects in OOB buckets', () => {

    before(done => {
        INGESTION_DESTINATION_BUCKET_NON_VERSIONED = `dst-bckt-non-versioned-${uuid()}`;
        scalityUtils.createIngestionBucketWithReplication(
            INGESTION_DESTINATION_BUCKET_NON_VERSIONED,
            INGESTION_LOCATION_NON_VERSIONED,
            REPLICATION_DESTINATION_BUCKET,
            REPLICATION_LOCATION,
            ROLE_ARN,
            done,
        );
    });

    after(done => async.series([
        next => ringS3CUtils.deleteAllVersions(
            INGESTION_SOURCE_BUCKET_NON_VERSIONED,
            null,
            next,
        ),
        next => scalityUtils.waitUntilEmpty(
            INGESTION_DESTINATION_BUCKET_NON_VERSIONED,
            next,
        ),
        next => scalityUtils.deleteVersionedBucket(
            INGESTION_DESTINATION_BUCKET_NON_VERSIONED,
            next,
        ),
        next => awsUtils.deleteAllVersions(
            REPLICATION_DESTINATION_BUCKET,
            `${INGESTION_SOURCE_BUCKET_NON_VERSIONED}/`,
            next,
        ),
    ], done));

    it('Should replicate existing non versioned OOB object', done => async.series([
        next => scalityUtils.waitUntilIngested(
            INGESTION_DESTINATION_BUCKET_NON_VERSIONED,
            OBJ_KEY_NON_VERSIONED,
            'null',
            next,
        ),
        next => scalityUtils.compareObjectsAWS(
            INGESTION_DESTINATION_BUCKET_NON_VERSIONED,
            REPLICATION_DESTINATION_BUCKET,
            OBJ_KEY_NON_VERSIONED,
            undefined,
            next,
        ),
    ], done));

    it('Should replicate existing non versioned zero byte OOB object', done => async.series([
        next => scalityUtils.waitUntilIngested(
            INGESTION_DESTINATION_BUCKET_NON_VERSIONED,
            OBJ_KEY_ZERO_BYTE_NON_VERSIONED,
            'null',
            next,
        ),
        next => scalityUtils.compareObjectsAWS(
            INGESTION_DESTINATION_BUCKET_NON_VERSIONED,
            REPLICATION_DESTINATION_BUCKET,
            OBJ_KEY_ZERO_BYTE_NON_VERSIONED,
            undefined,
            next,
        ),
    ], done));
});
