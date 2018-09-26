const crypto = require('crypto');
const async = require('async');
const assert = require('assert');

const quotaLocation = process.env.LOCATION_QUOTA_BACKEND;
const quotaSize= 1;

class QuotaUtility {
    constructor(s3) {
        this.s3 = s3;
    }

    _gbToBytes(sizeGB) {
        return sizeGB * 1024 * 1024 * 1024;
    }

    _deleteAllObjects(objList, bucketName, cb) {
        async.each(objList.Contents, (obj, next) => 
            this.s3.deleteObject({ Bucket: bucketName, Key: obj.Key }, next),
        cb);
    }

    _abortAllMpus(mpuList, bucketName, cb) {
        async.each(mpuList.Uploads, (mpu, next) =>
            this.s3.abortMultipartUpload({ Bucket: bucketName, Key: mpu.Key,
                UploadId: mpu.UploadId }, next),
        cb);
    }

    getQuotaError() {
        const errorString = 'AccessDenied: The assigned storage space limit ' +
            `for location ${quotaLocation} will be exceeded`;
        return errorString;
    }

    /**
     * createQuotaBucket - creates bucket in quotaLocation
     * @param {string} bucketName - name of bucket
     * @param {function} cb - callback to call
     * @return {undefined} 
     */
    createQuotaBucket(bucketName, cb) {
        const params = {
            Bucket: bucketName,
            CreateBucketConfiguration: {
                LocationConstraint: quotaLocation
            }
        };
        return this.s3.createBucket(params, cb);
    }

    /**
     * deleteQuotaBucket - empties and deletes bucket in quotalocation
     * @param {string} bucketName 
     * @param {function} cb
     * @return {undefined} 
     */
    deleteQuotaBucket(bucketName, cb) {
        async.series({
            objList: next => this.s3.listObjects({ Bucket: bucketName }, next),
            mpuList: next => this.s3.listMultipartUploads({ Bucket: bucketName }, next),
        }, (err, results) => {
            assert.ifError(err, `Error listing: ${err}`);
            async.series([
                next => this._deleteAllObjects(results.objList, bucketName, next),
                next => this._abortAllMpus(results.mpuList, bucketName, next),
                next => this.deleteBucket(bucketName, next),
            ], err => cb(err));
        })
    }

    /**
     * fillBucket - fills bucket to 99% of location quota
     * with multiple 10MB objects
     * @param {string} bucketName - name of bucket
     * @param {function} cb - callback function
     * @return {undefined}
     */
    fillBucket(bucketName, cb) {
        const bodySize = 10485760;
        const body = Buffer.alloc(bodySize);
        const numberObjs = Math.ceil((this._gbToBytes(quotaSize) * 0.99) / bodySize);
        const hex = crypto.createHash('md5')
            .update(Math.random().toString()).digest('hex');
        async.times(numberObjs, (n, next) => {
            const key = `${bucketName}/${hex}/quota-object${Date.now()}${n}`;
            process.stdout.write(`Putting object ${n+1}/${numberObjs}\n`);
            this.putObject(bucketName, key, body, next);
        }, cb);
    }

    putObject(bucketName, objectName, body, cb) {
        this.s3.putObject({
            Bucket: bucketName,
            Key: objectName,
            Body: body,
        }, cb);
    }

    createMPU(bucketName, objectName, cb) {
        this.s3.createMultipartUpload({
            Bucket: bucketName,
            Key: objectName,
        }, cb);
    }

    putPart(bucketName, objectName, body, uploadId, partNumber, cb) {
        this.s3.uploadPart({
            Bucket: bucketName,
            Key: objectName,
            Body: body,
            UploadId: uploadId,
            PartNumber: partNumber,
        }, cb);
    }

    deleteBucket(bucketName, cb) {
        this.s3.deleteBucket({ Bucket: bucketName }, cb);
    }
}

module.exports = QuotaUtility;
