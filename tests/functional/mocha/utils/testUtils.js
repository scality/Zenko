const {
    AbortMultipartUploadCommand,
    DeleteBucketCommand,
    DeleteObjectCommand,
    ListMultipartUploadsCommand,
    ListObjectsCommand,
} = require('@aws-sdk/client-s3');
const { scalityS3Client } = require('../s3SDK');

const testUtils = {};

testUtils.deleteAllObjects = async (objList, bucketName) => {
    if (!objList.Contents || objList.Contents.length === 0) {
        return;
    }
    await Promise.all(objList.Contents.map(obj => scalityS3Client.send(
        new DeleteObjectCommand({ Bucket: bucketName, Key: obj.Key }),
    )));
};

testUtils.abortAllMpus = async (mpuList, bucketName) => {
    if (!mpuList.Uploads || mpuList.Uploads.length === 0) {
        return;
    }
    await Promise.all(mpuList.Uploads.map(mpu => scalityS3Client.send(new AbortMultipartUploadCommand({
        Bucket: bucketName,
        Key: mpu.Key,
        UploadId: mpu.UploadId,
    }))));
};

testUtils.emptyDeleteBucket = async bucketName => {
    const [objList, mpuList] = await Promise.all([
        scalityS3Client.send(new ListObjectsCommand({ Bucket: bucketName })),
        scalityS3Client.send(new ListMultipartUploadsCommand({ Bucket: bucketName })),
    ]);
    await testUtils.deleteAllObjects(objList, bucketName);
    await testUtils.abortAllMpus(mpuList, bucketName);
    await scalityS3Client.send(new DeleteBucketCommand({ Bucket: bucketName }));
};

module.exports = testUtils;
