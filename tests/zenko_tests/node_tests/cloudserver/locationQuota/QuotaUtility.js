const crypto = require('crypto');
const async = require('async');
const assert = require('assert');
const {
    CreateBucketCommand,
    DeleteBucketCommand,
    PutObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    CreateMultipartUploadCommand,
    AbortMultipartUploadCommand,
    ListMultipartUploadsCommand,
    UploadPartCommand,
} = require('@aws-sdk/client-s3');

const quotaLocation = process.env.LOCATION_QUOTA_BACKEND;
const quotaSize = 0.1;

class QuotaUtility {
    constructor(s3) {
        this.s3 = s3;
    }

    _gbToBytes(sizeGB) {
        return sizeGB * 1024 * 1024 * 1024;
    }

    _deleteAllObjects(objList, bucketName, cb) {
        async.each(
            objList.Contents,
            (obj, next) => {
                this.s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: obj.Key }))
                    .then(() => next())
                    .catch(next);
            },
            cb,
        );
    }

    _abortAllMpus(mpuList, bucketName, cb) {
        async.each(
            mpuList.Uploads,
            (mpu, next) => {
                this.s3.send(new AbortMultipartUploadCommand({
                    Bucket: bucketName,
                    Key: mpu.Key,
                    UploadId: mpu.UploadId,
                }))
                    .then(() => next())
                    .catch(next);
            },
            cb,
        );
    }

    getQuotaError() {
        const errorString = 'AccessDenied: The assigned storage space limit '
            + `for location ${quotaLocation} will be exceeded`;
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
                LocationConstraint: quotaLocation,
            },
        };
        return this.s3.send(new CreateBucketCommand(params))
            .then(() => cb())
            .catch(cb);
    }

    /**
     * deleteQuotaBucket - empties and deletes bucket in quotalocation
     * @param {string} bucketName name of the bucket
     * @param {function} cb callback
     * @return {undefined}
     */
    deleteQuotaBucket(bucketName, cb) {
        async.series({
            objList: async () => this.s3.send(new ListObjectsV2Command({ Bucket: bucketName })),
            mpuList: async () => this.s3.send(new ListMultipartUploadsCommand({ Bucket: bucketName })),
        }, (err, results) => {
            assert.ifError(err, `Error listing: ${err}`);
            async.series([
                next => this._deleteAllObjects(results.objList, bucketName, next),
                next => this._abortAllMpus(results.mpuList, bucketName, next),
                next => {
                    this.deleteBucket(bucketName)
                        .then(() => next())
                        .catch(next);
                },
            ], cb);
        });
    }

    /**
     * fillBucket - fills bucket to 95% of location quota
     * with multiple 10MB objects
     * @param {string} bucketName - name of bucket
     * @param {function} cb - callback function
     * @return {undefined}
     */
    fillBucket(bucketName, cb) {
        const bodySize = 10485760;
        const body = Buffer.alloc(bodySize);
        const numberObjs = Math.ceil((this._gbToBytes(quotaSize) * 0.95) / bodySize);
        const hex = crypto.createHash('md5')
            .update(Math.random().toString()).digest('hex');
        async.times(numberObjs, (n, next) => {
            const key = `${bucketName}/${hex}/quota-object${Date.now()}${n}`;
            process.stdout.write(`Putting object ${n + 1}/${numberObjs}\n`);
            this.putObject(bucketName, key, body)
                .then(() => next())
                .catch(next);
        }, cb);
    }

    async putObject(bucketName, objectName, body) {
        const payload = body ?? '';
        return this.s3.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: objectName,
            Body: payload,
            ContentLength: Buffer.byteLength(payload),
        }));
    }

    async createMPU(bucketName, objectName) {
        return this.s3.send(new CreateMultipartUploadCommand({
            Bucket: bucketName,
            Key: objectName,
        }));
    }

    async putPart(bucketName, objectName, body, uploadId, partNumber) {
        return this.s3.send(new UploadPartCommand({
            Bucket: bucketName,
            Key: objectName,
            Body: body,
            UploadId: uploadId,
            PartNumber: partNumber,
        }));
    }

    async deleteBucket(bucketName) {
        return this.s3.send(new DeleteBucketCommand({ Bucket: bucketName }));
    }
}

module.exports = QuotaUtility;
