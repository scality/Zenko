const assert = require('assert');
const  { series } = require('async');
const uuid = require('uuid/v4');

const { scalityS3Client, ringS3Client } = require('../../../s3SDK');
const IngestionUtility = require('../../IngestionUtility');
const BackbeatAPIUtility = require('../../BackbeatAPIUtility');

const scalityUtils = new IngestionUtility(scalityS3Client, ringS3Client);
const ringS3CUtils = new IngestionUtility(ringS3Client);
const backbeatAPIUtils = new BackbeatAPIUtility();
const ingestionSrcBucket = process.env.RING_S3C_INGESTION_SRC_BUCKET_NAME;
const srcLocation = process.env.RING_S3C_BACKEND_SOURCE_LOCATION;
const location = srcLocation;
let INGESTION_DEST_BUCKET;
let KEY_PREFIX;
let OBJ_KEY1;
let OBJ_KEY2;
let OBJ_DATA;
const INGESTION_TIMEOUT = 300000;

describe('Ingestion pause resume', function() {
    this.timeout(INGESTION_TIMEOUT);

    beforeEach(done => {
        INGESTION_DEST_BUCKET = `ingestion-dest-bucket-${uuid()}`;
        KEY_PREFIX = `${ingestionSrcBucket}-${uuid()}`;
        OBJ_KEY1 = `${KEY_PREFIX}/object-to-ingest-${uuid()}`;
        OBJ_KEY2 = `${KEY_PREFIX}/object-to-ingest-${uuid()}`;
        scalityUtils.createIngestionBucket(INGESTION_DEST_BUCKET, location, err =>{
            assert.ifError(err);
            return done();
        });
    });

    afterEach(done => series([
        next => ringS3CUtils.deleteAllVersions(ingestionSrcBucket,
            null, next),
        next => scalityUtils.waitUntilEmpty(INGESTION_DEST_BUCKET, next),
        next => scalityUtils.deleteVersionedBucket(
            INGESTION_DEST_BUCKET, next),
    ], done));

    it('should pause and resume ingestion', done => {
        return series([
            next => ringS3CUtils.putObject(ingestionSrcBucket, OBJ_KEY1, null, (err, data) => {
                assert.ifError(err);
                OBJ_DATA = data;
                return next();
            }),
            next => scalityUtils.compareObjectsRINGS3C(ingestionSrcBucket,
                INGESTION_DEST_BUCKET, OBJ_KEY1, OBJ_DATA.VersionId, undefined, next),
            next => backbeatAPIUtils.pauseIngestion(location, next),
            next => setTimeout(next, 5000),
            next => backbeatAPIUtils.getIngestionStatus(null, (err, data) => {
                assert.ifError(err);
                assert(data[location]);
                assert.strictEqual(data[location], 'disabled');
                return next();
            }),
            next => ringS3CUtils.putObject(ingestionSrcBucket, OBJ_KEY2, null, (err, data) => {
                assert.ifError(err);
                OBJ_DATA = data;
                return next();
            }),
            next => setTimeout(next, 15000),
            next => scalityUtils.assertNoObject(INGESTION_DEST_BUCKET, OBJ_KEY2, next),
            next => backbeatAPIUtils.resumeIngestion(location, next),
            next => setTimeout(next, 5000),
            next => backbeatAPIUtils.getIngestionStatus(null, (err, data) => {
                assert.ifError(err);
                assert(data[location]);
                assert.strictEqual(data[location], 'enabled');
                return next();
            }),
            next => scalityUtils.compareObjectsRINGS3C(ingestionSrcBucket,
                INGESTION_DEST_BUCKET, OBJ_KEY2, OBJ_DATA.VersionId, undefined, next),
        ], done);
    });

    it('should get 404 error in data for status of non-existent location',
        done => {
        return backbeatAPIUtils.getIngestionStatus('non-existent-location',
            (err, data) => {
            assert.ifError(err);
            assert.strictEqual(data.code, 404);
            assert.strictEqual(data.RouteNotFound, true);
            return done();
        });
    });

    it('should be able to set a ingestion resume schedule', done => series([
        next => backbeatAPIUtils.pauseIngestion(null, next),
        next => setTimeout(next, 5000),
        next => backbeatAPIUtils.getIngestionStatus(null, (err, data) => {
            assert.ifError(err);
            assert(data[location]);
            assert.strictEqual(data[location], 'disabled');
            return next();
        }),
        next => backbeatAPIUtils.resumeIngestion(location, true, 1, next),
        next => setTimeout(next, 5000),
        next => backbeatAPIUtils.getIngestionResumeSchedule(location,
            (err, data) => {
            assert.ifError(err);
            assert(data[location]);
            const requestTimeMs = Date.now();
            const resumeTime = new Date(data[location]);
            const resumeTimeMs = resumeTime.getTime();
            const timediff = resumeTimeMs - requestTimeMs;
            const hrdiff = (timediff/1000)/3600;
            assert.strictEqual(Math.round(hrdiff), 1);
            return next();
        }),
    ], done));
});
