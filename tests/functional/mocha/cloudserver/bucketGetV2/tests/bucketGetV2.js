const assert = require('assert');
const async = require('async');
const { v4: uuidV4 } = require('uuid');
const {
    CreateBucketCommand,
    PutObjectCommand,
    DeleteObjectCommand,
    DeleteBucketCommand,
    ListObjectsV2Command,
} = require('@aws-sdk/client-s3');

const s3 = require('../../../s3SDK').scalityS3Client;

const bucket = `list-v2-${uuidV4()}`;

function putObjects(cb) {
    async.times(10, (n, next) => {
        s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: `key-${n}`,
            Body: '',
            ContentLength: 0,
        }))
            .then(() => next())
            .catch(next);
    }, cb);
}

function emptyBucket(cb) {
    async.times(10, (n, next) => {
        s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: `key-${n}` }))
            .then(() => next())
            .catch(next);
    }, cb);
}

function expectedKeyList(startKey, endKey) {
    const expKeyList = [];
    for (let i = startKey; i <= endKey; i++) {
        expKeyList.push(`key-${i}`);
    }
    return expKeyList;
}

describe('Bucket GET V2 api', () => {
    before(done => {
        async.series([
            next => {
                s3.send(new CreateBucketCommand({ Bucket: bucket }))
                    .then(() => next())
                    .catch(next);
            },
            next => putObjects(next),
        ], err => {
            assert.ifError(err);
            done();
        });
    });

    after(done => {
        async.series([
            next => emptyBucket(next),
            next => {
                s3.send(new DeleteBucketCommand({ Bucket: bucket }))
                    .then(() => next())
                    .catch(next);
            },
        ], err => {
            assert.ifError(err);
            done();
        });
    });

    it('should list objects in V2 format', async () => {
        const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket }));
        const keyList = [];
        res.Contents.forEach(object => keyList.push(object.Key));
        assert.deepStrictEqual(keyList, expectedKeyList(0, 9));
    });

    it('should list only objects after startAfter value', async () => {
        const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket, StartAfter: 'key-7' }));
        const keyList = [];
        res.Contents.forEach(object => keyList.push(object.Key));
        assert.deepStrictEqual(keyList, expectedKeyList(8, 9));
    });

    it('should include NextContinuationToken in truncated response', async () => {
        const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 5 }));
        assert(res.NextContinuationToken);
    });

    it('should list objects after continuation token value', async () => {
        const objList = await s3.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 5 }));
        const objList2 = await s3.send(new ListObjectsV2Command({
            Bucket: bucket,
            MaxKeys: 5,
            ContinuationToken: objList.NextContinuationToken,
        }));
        const keyList = [];
        objList2.Contents.forEach(object => keyList.push(object.Key));
        assert.deepStrictEqual(keyList, expectedKeyList(5, 9));
    });

    it('should ignore startAfter value if both startAfter and '
    + 'continuationToken are included', async () => {
        const objList = await s3.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 5 }));
        const objList2 = await s3.send(new ListObjectsV2Command({
            Bucket: bucket,
            MaxKeys: 5,
            StartAfter: 'key-7',
            ContinuationToken: objList.NextContinuationToken,
        }));
        const keyList = [];
        objList2.Contents.forEach(object => keyList.push(object.Key));
        assert.deepStrictEqual(keyList, expectedKeyList(5, 9));
    });

    it(
        'should include Owner in response if fetchOwner is included in request',
        async () => {
            const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket, FetchOwner: true }));
            res.Contents.forEach(object => assert(object.Owner));
        },
    );
});
