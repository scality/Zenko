const assert = require('assert');
const async = require('async');
const uuid = require('uuid/v4');

const { ListObjectVersionsCommand } = require('@aws-sdk/client-s3');
const { scalityS3Client, ringS3Client } = require('../../../s3SDK');
const IngestionUtility = require('../../IngestionUtility');

const scalityUtils = new IngestionUtility(scalityS3Client, ringS3Client);
const ringS3CUtils = new IngestionUtility(ringS3Client);
const ingestionSrcBucket = process.env.RING_S3C_INGESTION_SRC_BUCKET_NAME;
const srcLocation = process.env.RING_S3C_BACKEND_SOURCE_LOCATION;
const ingestionNonVersionedSrcBucket = process.env.RING_S3C_INGESTION_SRC_NON_VERSIONED_BUCKET_NAME;
// Multiplying by 3 to account for the 3 types of objects: simple, zero-byte, and multipart
const nonVersionedObjectCount = parseInt(process.env.RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE, 10) * 3;
const srcNonVersionedLocation = process.env.RING_S3C_BACKEND_SOURCE_NON_VERSIONED_LOCATION;
const location = srcLocation;
let INGESTION_DEST_BUCKET;
let KEY_PREFIX;
let OBJ_KEY;

describe('Ingesting existing data from RING S3C bucket', () => {
    beforeEach(function () {
        INGESTION_DEST_BUCKET = `ingestion-${uuid()}`;
        KEY_PREFIX = `${ingestionSrcBucket}-${uuid()}`;
        OBJ_KEY = `${KEY_PREFIX}/object-to-ingest-${uuid()}`;
        this.testState = {
            skipCleanup: false,
        };
    });

    afterEach(function (done) {
        if (this.testState.skipCleanup) {
            return done();
        }
        return async.series([
            next => ringS3CUtils.deleteAllVersions(
                ingestionSrcBucket,
                null,
                next,
            ),
            next => ringS3CUtils.putBucketVersioning(
                ingestionSrcBucket,
                'Enabled',
                next,
            ),
            next => scalityUtils.waitUntilEmpty(INGESTION_DEST_BUCKET, next),
            next => scalityUtils.deleteVersionedBucket(INGESTION_DEST_BUCKET, next),
        ], done);
    });

    it('should ingest an object', done => async.waterfall([
        // object
        next => ringS3CUtils.putObject(
            ingestionSrcBucket,
            OBJ_KEY,
            Buffer.alloc(1),
            next,
        ),
        // create ingestion bucket
        (objData, next) => scalityUtils.createIngestionBucket(
            INGESTION_DEST_BUCKET,
            location,
            err => next(err, objData),
        ),
        // compare object
        (objData, next) => scalityUtils.compareObjectsRINGS3C(
            ingestionSrcBucket,
            INGESTION_DEST_BUCKET,
            OBJ_KEY,
            objData.VersionId,
            undefined,
            next,
        ),
    ], done));

    it('should ingest a 0-byte object', done => async.waterfall([
        next => ringS3CUtils.putObject(
            ingestionSrcBucket,
            OBJ_KEY,
            null,
            next,
        ),
        (objData, next) => scalityUtils.createIngestionBucket(
            INGESTION_DEST_BUCKET,
            location,
            err => next(err, objData),
        ),
        (objData, next) => scalityUtils.compareObjectsRINGS3C(
            ingestionSrcBucket,
            INGESTION_DEST_BUCKET,
            OBJ_KEY,
            objData.VersionId,
            undefined,
            next,
        ),
    ], done));

    it('should ingest a tagged object', done => async.waterfall([
        next => ringS3CUtils.putObject(
            ingestionSrcBucket,
            OBJ_KEY,
            null,
            next,
        ),
        (objData, next) => ringS3CUtils.putObjectTagging(
            ingestionSrcBucket,
            OBJ_KEY,
            objData.VersionId,
            next,
        ),
        (objData, next) => scalityUtils.createIngestionBucket(
            INGESTION_DEST_BUCKET,
            location,
            err => next(err, objData),
        ),
        (objData, next) => scalityUtils.compareObjectsRINGS3C(
            ingestionSrcBucket,
            INGESTION_DEST_BUCKET,
            OBJ_KEY,
            objData.VersionId,
            undefined,
            err => next(err, objData),
        ),
        (objData, next) => scalityUtils.compareObjectTagsRINGS3C(
            ingestionSrcBucket,
            INGESTION_DEST_BUCKET,
            OBJ_KEY,
            objData.VersionId,
            next,
        ),
    ], done));

    it('should ingest all versions of an object', done => async.waterfall([
        next => ringS3CUtils.putObject(
            ingestionSrcBucket,
            OBJ_KEY,
            null,
            next,
        ),
        (objData1, next) => ringS3CUtils.putObject(
            ingestionSrcBucket,
            OBJ_KEY,
            Buffer.alloc(1),
            (err, objData2) => next(err, objData1, objData2),
        ),
        (objData1, objData2, next) => scalityUtils.createIngestionBucket(
            INGESTION_DEST_BUCKET,
            location,
            err => next(err, objData1, objData2),
        ),
        (objData1, objData2, next) => scalityUtils.compareObjectsRINGS3C(
            ingestionSrcBucket,
            INGESTION_DEST_BUCKET,
            OBJ_KEY,
            objData1.VersionId,
            undefined,
            err => next(err, objData2),
        ),
        (objData2, next) => scalityUtils.compareObjectsRINGS3C(
            ingestionSrcBucket,
            INGESTION_DEST_BUCKET,
            OBJ_KEY,
            objData2.VersionId,
            undefined,
            next,
        ),
    ], done));

    it('should ingest delete markers on object', done => async.waterfall([
        next => ringS3CUtils.putObject(
            ingestionSrcBucket,
            OBJ_KEY,
            null,
            next,
        ),
        (objData, next) => ringS3CUtils.deleteObject(
            ingestionSrcBucket,
            OBJ_KEY,
            null,
            err => next(err, objData),
        ),
        (objData, next) => scalityUtils.createIngestionBucket(
            INGESTION_DEST_BUCKET,
            location,
            err => next(err, objData),
        ),
        (objData, next) => scalityUtils.compareObjectsRINGS3C(
            ingestionSrcBucket,
            INGESTION_DEST_BUCKET,
            OBJ_KEY,
            objData.VersionId,
            null,
            next,
        ),
        next => scalityUtils.waitUntilDeleted(INGESTION_DEST_BUCKET, OBJ_KEY, null, next),
        next => scalityUtils.s3.send(new ListObjectVersionsCommand({
            Bucket: INGESTION_DEST_BUCKET,
        }))
            .then(data => next(null, data))
            .catch(next),
        (zenkoData, next) => ringS3CUtils.s3.send(new ListObjectVersionsCommand({
            Bucket: ingestionSrcBucket,
        }))
            .then(data => next(null, zenkoData, data))
            .catch(next),
    ], (err, zenkoData, s3cData) => {
        if (err) {
            return done(err);
        }
        assert.strictEqual(zenkoData.Versions.length, s3cData.Versions.length);
        assert.strictEqual(zenkoData.DeleteMarkers.length, s3cData.DeleteMarkers.length);
        return done();
    }));

    it('should ingest an MPU object: single 0-byte part', done => async.waterfall([
        next => ringS3CUtils.completeSinglePartMPU(ingestionSrcBucket, OBJ_KEY, 0, next),
        (mpuData, next) => scalityUtils.createIngestionBucket(
            INGESTION_DEST_BUCKET,
            location,
            err => next(err, mpuData),
        ),
        (mpuData, next) => scalityUtils.compareObjectsRINGS3C(
            ingestionSrcBucket,
            INGESTION_DEST_BUCKET,
            OBJ_KEY,
            mpuData.VersionId,
            undefined,
            next,
        ),
    ], done));

    it('should ingest an MPU object: single 1-byte part', done => async.waterfall([
        next => ringS3CUtils.completeSinglePartMPU(ingestionSrcBucket, OBJ_KEY, 1, next),
        (mpuData, next) => scalityUtils.createIngestionBucket(
            INGESTION_DEST_BUCKET,
            location,
            err => next(err, mpuData),
        ),
        (mpuData, next) => scalityUtils.compareObjectsRINGS3C(
            ingestionSrcBucket,
            INGESTION_DEST_BUCKET,
            OBJ_KEY,
            mpuData.VersionId,
            undefined,
            next,
        ),
    ], done));

    it('should ingest an MPU object: 2 parts', done => async.waterfall([
        next => ringS3CUtils.completeMPUAWS(ingestionSrcBucket, OBJ_KEY, 2, next),
        (mpuData, next) => scalityUtils.createIngestionBucket(
            INGESTION_DEST_BUCKET,
            location,
            err => next(err, mpuData),
        ),
        (mpuData, next) => scalityUtils.compareObjectsRINGS3C(
            ingestionSrcBucket,
            INGESTION_DEST_BUCKET,
            OBJ_KEY,
            mpuData.VersionId,
            undefined,
            next,
        ),
    ], done));

    it('should ingest system metadata', done => async.waterfall([
        next => ringS3CUtils.putObjectWithProperties(ingestionSrcBucket, OBJ_KEY, Buffer.alloc(1), next),
        (objData, next) => scalityUtils.createIngestionBucket(
            INGESTION_DEST_BUCKET,
            location,
            err => next(err, objData),
        ),
        (objData, next) => scalityUtils.compareObjectsRINGS3C(
            ingestionSrcBucket,
            INGESTION_DEST_BUCKET,
            OBJ_KEY,
            objData.VersionId,
            ['ContentType',
                'CacheControl', 'ContentDisposition', 'ContentEncoding', 'ContentLanguage'],
            next,
        ),
    ], done));

    it('should ingest user metadata', done => async.waterfall([
        next => ringS3CUtils.putObjectWithUserMetadata(
            ingestionSrcBucket,
            OBJ_KEY,
            Buffer.alloc(1),
            next,
        ),
        (objData, next) => scalityUtils.createIngestionBucket(
            INGESTION_DEST_BUCKET,
            location,
            err => next(err, objData),
        ),
        (objData, next) => scalityUtils.compareObjectsRINGS3C(
            ingestionSrcBucket,
            INGESTION_DEST_BUCKET,
            OBJ_KEY,
            objData.VersionId,
            ['Metadata'],
            next,
        ),
    ], done));

    it('should ingest a versioning suspended object', done => async.series([
        next => ringS3CUtils.putBucketVersioning(
            ingestionSrcBucket,
            'Suspended',
            next,
        ),
        next => ringS3CUtils.putObject(
            ingestionSrcBucket,
            OBJ_KEY,
            Buffer.alloc(1),
            next,
        ),
        next => ringS3CUtils.putBucketVersioning(
            ingestionSrcBucket,
            'Enabled',
            next,
        ),
        next => scalityUtils.createIngestionBucket(
            INGESTION_DEST_BUCKET,
            location,
            next,
        ),
        next => scalityUtils.compareObjectsRINGS3C(
            ingestionSrcBucket,
            INGESTION_DEST_BUCKET,
            OBJ_KEY,
            'null',
            undefined,
            next,
        ),
    ], done));

    it('should ingest a null version of a versioned object', done => async.series([
        next => ringS3CUtils.putObject(
            ingestionSrcBucket,
            OBJ_KEY,
            Buffer.alloc(1),
            next,
        ),
        next => ringS3CUtils.putBucketVersioning(
            ingestionSrcBucket,
            'Suspended',
            next,
        ),
        next => ringS3CUtils.putObject(
            ingestionSrcBucket,
            OBJ_KEY,
            Buffer.alloc(1),
            next,
        ),
        next => ringS3CUtils.putBucketVersioning(
            ingestionSrcBucket,
            'Enabled',
            next,
        ),
        next => scalityUtils.createIngestionBucket(
            INGESTION_DEST_BUCKET,
            location,
            next,
        ),
        next => scalityUtils.compareObjectsRINGS3C(
            ingestionSrcBucket,
            INGESTION_DEST_BUCKET,
            OBJ_KEY,
            'null',
            undefined,
            next,
        ),
    ], done));

    // The source bucket used in this test has non versioned objects of 3 types: simple, zero-byte, and multipart
    // These non versioned objects were put before creating the location as the bucket has to be versioned
    // for the location to be created, and once it's versioned can't be set to non versioned again. This is
    // done to avoid having to create the location during the tests which might impact other tests running
    // in parallel.
    it('should ingest all non versioned objects', function (done) {
        // skipping cleanup as deleting the ingestion bucket requires
        // deleting all objects which will delete the source bucket objects
        this.testState.skipCleanup = true;
        async.waterfall([
            next => scalityUtils.createIngestionBucket(
                INGESTION_DEST_BUCKET,
                srcNonVersionedLocation,
                next,
            ),
            next => {
                ringS3CUtils.s3.send(new ListObjectVersionsCommand({
                    Bucket: ingestionNonVersionedSrcBucket,
                }))
                    .then(data => next(null, data))
                    .catch(next);
            },
            (data, next) => {
                const versions = data.Versions || [];
                const deleteMarkers = data.DeleteMarkers || [];
                assert.strictEqual(versions.length, nonVersionedObjectCount);
                assert.strictEqual(deleteMarkers.length, 0);
                async.forEach(versions, (version, cb) => {
                    scalityUtils.compareObjectsRINGS3C(
                        ingestionNonVersionedSrcBucket,
                        INGESTION_DEST_BUCKET,
                        version.Key,
                        'null',
                        undefined,
                        cb,
                    );
                }, next);
            },
        ], done);
    });
});

