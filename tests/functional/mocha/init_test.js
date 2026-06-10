const assert = require('assert');
const { v4: uuidV4 } = require('uuid');
const {
    CreateBucketCommand,
    DeleteBucketCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    ListBucketsCommand,
    ListObjectsCommand,
    PutObjectCommand,
} = require('@aws-sdk/client-s3');

const { config } = require('tests_common/configuration');
let s3;

const bucket = `get-bucket-${uuidV4()}`;
const key = `object-key-${uuidV4()}`;
const body = 'testbody';

describe('Test Configuration', () => {
    before(() => { s3 = config.ZenkoAccount.s3Client; });

    it('should create a bucket and upload an object', async () => {
        await s3.send(new CreateBucketCommand({
            Bucket: bucket,
            CreateBucketConfiguration: {
                LocationConstraint: 'us-east-1',
            },
        }));
        const listBucketsRes = await s3.send(new ListBucketsCommand({}));
        assert.strictEqual(listBucketsRes.Buckets.length, 1);
        assert.strictEqual(listBucketsRes.Buckets[0].Name, bucket);
        await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentLength: Buffer.byteLength(body),
        }));
        const getObjectRes = await s3.send(new GetObjectCommand(
            { Bucket: bucket, Key: key },
        ));
        const chunks = [];
        // eslint-disable-next-line no-restricted-syntax
        for await (const chunk of getObjectRes.Body) {
            chunks.push(chunk);
        }
        const resBody = Buffer.concat(chunks).toString('utf-8');
        assert.strictEqual(body, resBody);
        const listObjectsRes = await s3.send(new ListObjectsCommand({ Bucket: bucket }));
        assert.strictEqual(listObjectsRes.Contents.length, 1);
        assert.strictEqual(listObjectsRes.Contents[0].Key, key);
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
        await s3.send(new DeleteBucketCommand({ Bucket: bucket }));
    });
});
