const assert = require('assert');
const async = require('async');
const { scalityS3Client } = require('../s3SDK');

testUtils = {};

testUtils.deleteAllObjects = (objList, bucketName, cb) => {
    async.each(objList.Contents, (obj, next) => 
        scalityS3Client.deleteObject({ Bucket: bucketName, Key: obj.Key }, next),
    cb);
}

testUtils.abortAllMpus = (mpuList, bucketName, cb) => {
    async.each(mpuList.Uploads, (mpu, next) =>
        scalityS3Client.abortMultipartUpload({ Bucket: bucketName, Key: mpu.Key,
            UploadId: mpu.UploadId }, next),
    cb);
}

testUtils.emptyDeleteBucket = (bucketName, cb) => {
    async.series({
        objList: next => scalityS3Client.listObjects({ Bucket: bucketName }, next),
        mpuList: next => scalityS3Client.listMultipartUploads({ Bucket: bucketName }, next),
    }, (err, results) => {
        assert.ifError(err, `Error listing: ${err}`);
        async.series([
            next => testUtils.deleteAllObjects(results.objList, bucketName, next),
            next => testUtils.abortAllMpus(results.mpuList, bucketName, next),
            next => scalityS3Client.deleteBucket({ Bucket: bucketName }, next),
        ], err => cb(err));
    });
};

module.exports = testUtils;
