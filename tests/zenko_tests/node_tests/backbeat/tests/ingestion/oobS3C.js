const assert = require('assert');
const async = require('async');
const uuid = require('uuid/v4');

const { scalityS3Client, ringS3Client } = require('../../../s3SDK');
const IngestionUtility = require('../../IngestionUtility');

const scalityUtils = new IngestionUtility(scalityS3Client, ringS3Client);
const ringS3CUtils = new IngestionUtility(ringS3Client);
const ingestionSrcBucket = process.env.RING_S3C_INGESTION_SRC_BUCKET_NAME;
const srcLocation = process.env.RING_S3C_BACKEND_SOURCE_LOCATION;
const location = srcLocation;
const KEY_PREFIX = `${ingestionSrcBucket}-${uuid()}`;
let INGESTION_DEST_BUCKET;
let OBJ_KEY;

describe('OOB updates for RING S3C bucket', () => {
    beforeEach(done => {
        INGESTION_DEST_BUCKET = `ingestion-dest-bucket-${uuid()}`;
        OBJ_KEY = `${KEY_PREFIX}/object-to-ingest-${uuid()}`;
        return scalityUtils.createIngestionBucket(
            INGESTION_DEST_BUCKET, location, done);
    });

    afterEach(done => async.series([
        next => ringS3CUtils.deleteAllVersions(ingestionSrcBucket, null,
            next),
        next => scalityUtils.waitUntilEmpty(INGESTION_DEST_BUCKET, next),
        next => scalityUtils.deleteVersionedBucket(INGESTION_DEST_BUCKET,
            next),
    ], done));

    it('should receive OOB update with an object', done => {
        return async.waterfall([
            next => ringS3CUtils.putObject(ingestionSrcBucket, OBJ_KEY,
                Buffer.alloc(1), next),
            (objData, next) => scalityUtils.compareObjectsRINGS3C(ingestionSrcBucket,
                INGESTION_DEST_BUCKET, OBJ_KEY, objData.VersionId, undefined, next),
        ], done);
    });

    it('should receive OOB update with 0-byte object', done => {
        return async.waterfall([
            next => ringS3CUtils.putObject(ingestionSrcBucket, OBJ_KEY,
                null, next),
            (objData, next) => scalityUtils.compareObjectsRINGS3C(ingestionSrcBucket,
                INGESTION_DEST_BUCKET, OBJ_KEY, objData.VersionId, undefined, next),
        ], done);
    });

    it('should receive OOB update with tagged object', done => {
        return async.waterfall([
            next => ringS3CUtils.putObject(ingestionSrcBucket, OBJ_KEY,
                null, next),
            (objData, next) => scalityUtils.compareObjectsRINGS3C(ingestionSrcBucket,
                INGESTION_DEST_BUCKET, OBJ_KEY, objData.VersionId, undefined, err => {
                    return next(err, objData);
                }),
            (objData, next) => ringS3CUtils.putObjectTagging(ingestionSrcBucket,
                OBJ_KEY, objData.VersionId, (err, data) => {
                    return next(err, data);
                }),
            (tagObjData, next) => scalityUtils.compareObjectTagsRINGS3C(ingestionSrcBucket,
                INGESTION_DEST_BUCKET, OBJ_KEY, tagObjData.VersionId, next),
        ], done);
    });

    it('should receive OOB update with all versions of an object', done => {
        return async.waterfall([
            next => ringS3CUtils.putObject(ingestionSrcBucket, OBJ_KEY,
                null, next),
            (objData, next) => ringS3CUtils.s3.listObjectVersions({
                Bucket: ingestionSrcBucket,
            }, next),
            (objData1, next) => scalityUtils.compareObjectsRINGS3C(ingestionSrcBucket,
                INGESTION_DEST_BUCKET, OBJ_KEY, objData1.VersionId, undefined, next),
            next => ringS3CUtils.putObject(ingestionSrcBucket, OBJ_KEY, Buffer.alloc(1), next),
            (objData2, next) => scalityUtils.compareObjectsRINGS3C(ingestionSrcBucket,
                INGESTION_DEST_BUCKET, OBJ_KEY, objData2.VersionId, undefined, next),
        ], done);
    });

    it('should receive OOB update with MPU object: single 0-byte part', done => {
        return async.waterfall([
            next => ringS3CUtils.completeSinglePartMPU(ingestionSrcBucket, OBJ_KEY, 0, next),
            (mpuData, next) => scalityUtils.compareObjectsRINGS3C(ingestionSrcBucket,
                INGESTION_DEST_BUCKET, OBJ_KEY, mpuData.versionId, undefined, next),
        ], done);
    });

    it('should receive OOB updated with MPU object: single 1-byte part', done => {
        return async.waterfall([
            next => ringS3CUtils.completeSinglePartMPU(ingestionSrcBucket, OBJ_KEY, 1, next),
            (mpuData, next) => scalityUtils.compareObjectsRINGS3C(ingestionSrcBucket,
                INGESTION_DEST_BUCKET, OBJ_KEY, mpuData.VersionId, undefined, next),
        ], done);
    });

    it('should ingest an MPU object: 2 parts', done => {
        return async.waterfall([
            next => ringS3CUtils.completeMPUAWS(ingestionSrcBucket, OBJ_KEY, 2, next),
            (mpuData, next) => scalityUtils.compareObjectsRINGS3C(ingestionSrcBucket,
                INGESTION_DEST_BUCKET, OBJ_KEY, mpuData.VersionId, undefined, next),
        ], done);
    });
});
