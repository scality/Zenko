const assert = require('assert');
const async = require('async');
const uuidV4 = require('uuid/v4');

const s3 = require('../../../s3SDK').scalityS3Client;

const bucket = `list-v2-${uuidV4()}`;

function putObjects(cb) {
    async.times(10, (n, next) => {
        s3.putObject({ Bucket: bucket, Key: `key-${n}` }, next);
    }, cb);
}

function emptyBucket(cb) {
    async.times(10, (n, next) => {
        s3.deleteObject({ Bucket: bucket, Key: `key-${n}` }, next);
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
            next => s3.createBucket({ Bucket: bucket }, next),
            next => putObjects(next),
        ], err => {
            assert.ifError(err);
            done();
        });
    });

    after(done => {
        async.series([
            next => emptyBucket(next),
            next => s3.deleteBucket({ Bucket: bucket }, next),
        ], err => {
            assert.ifError(err);
            done();
        });
    });

    it('should list objects in V2 format', done => {
        s3.listObjectsV2({ Bucket: bucket }, (err, res) => {
            assert.ifError(err);
            const keyList = [];
            res.Contents.forEach(object => keyList.push(object.Key));
            assert.deepStrictEqual(keyList, expectedKeyList(0, 9));
            done();
        });
    });

    it('should list only objects after startAfter value', done => {
        s3.listObjectsV2(
            { Bucket: bucket, StartAfter: 'key-7' },
            (err, res) => {
                assert.ifError(err);
                const keyList = [];
                res.Contents.forEach(object => keyList.push(object.Key));
                assert.deepStrictEqual(keyList, expectedKeyList(8, 9));
                done();
            },
        );
    });

    it('should include NextContinuationToken in truncated response', done => {
        s3.listObjectsV2({ Bucket: bucket, MaxKeys: 5 }, (err, res) => {
            assert.ifError(err);
            assert(res.NextContinuationToken);
            done();
        });
    });

    it('should list objects after continuation token value', done => {
        async.waterfall([
            next => s3.listObjectsV2({ Bucket: bucket, MaxKeys: 5 }, next),
            (objList, next) => s3.listObjectsV2({
                Bucket: bucket,
                MaxKeys: 5,
                ContinuationToken: objList.NextContinuationToken,
            }, next),
        ], (err, objList2) => {
            assert.ifError(err);
            const keyList = [];
            objList2.Contents.forEach(object => keyList.push(object.Key));
            assert.deepStrictEqual(keyList, expectedKeyList(5, 9));
            done();
        });
    });

    it('should ignore startAfter value if both startAfter and '
    + 'continuationToken are included', done => {
        async.waterfall([
            next => s3.listObjectsV2({ Bucket: bucket, MaxKeys: 5 }, next),
            (objList, next) => {
                s3.listObjectsV2({
                    Bucket: bucket,
                    MaxKeys: 5,
                    StartAfter: 'key-7',
                    ContinuationToken: objList.NextContinuationToken,
                }, next);
            },
        ], (err, objList2) => {
            assert.ifError(err);
            const keyList = [];
            objList2.Contents.forEach(object => keyList.push(object.Key));
            assert.deepStrictEqual(keyList, expectedKeyList(5, 9));
            done();
        });
    });

    it(
        'should include Owner in response if fetchOwner is included in request',
        done => {
            s3.listObjectsV2({ Bucket: bucket, FetchOwner: true }, (err, res) => {
                assert.ifError(err);
                res.Contents.forEach(object => assert(object.Owner));
                done();
            });
        },
    );
});
