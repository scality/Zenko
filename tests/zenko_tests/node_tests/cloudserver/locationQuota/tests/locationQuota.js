const assert = require('assert');
const crypto = require('crypto');
const async = require('async');

const { scalityS3Client } = require('../../../s3SDK');
const QuotaUtility = require('../QuotaUtility');

const TEN_MB_BYTES = 10485760;
const bucket = `quota-bucket-${Date.now()}`;

const scalityS3 = new QuotaUtility(scalityS3Client);

describe('Location storage quota', () => {
    beforeEach(function beFn(done) {
        this.timeout(50000);
        async.series([
            next => scalityS3.createQuotaBucket(bucket, next),
            next => scalityS3.fillBucket(bucket, next),
        ], err => {
            assert.ifError(err, 'Error creating and filling quota bucket' +
                `${err}`);
            done();
        });
    });

    afterEach(done => {
        scalityS3.deleteQuotaBucket(bucket, done);
    });

    it('should throw error if location quota exceeded on object put', done => {
        const hex = crypto.createHash('md5')
            .update(Math.random().toString()).digest('hex');
        const key = `${bucket}/${hex}/quota-object-exceed-limit${Date.now()}`;
        const body = Buffer.alloc(TEN_MB_BYTES);
        return scalityS3.putObject(bucket, key, body, err => {
            assert.strictEqual(err.toString(), scalityS3.getQuotaError());
            done();
        });
    });

    it('should throw error if location quota exceeded on mpu part put', done => {
        const hex = crypto.createHash('md5')
            .update(Math.random().toString()).digest('hex');
        const key = `${bucket}/${hex}/quota-object-exceed-limit${Date.now()}`;
        return async.waterfall([
            next => {
                scalityS3.createMPU(bucket, key, next);
            },
            (mpuData, next) => {
                const body = Buffer.alloc(TEN_MB_BYTES);
                scalityS3.putPart(bucket, key, body, mpuData.UploadId, 1, next);
            }
        ], err => {
            assert.strictEqual(err.toString(), scalityS3.getQuotaError());
            done();
        });
    });
});


