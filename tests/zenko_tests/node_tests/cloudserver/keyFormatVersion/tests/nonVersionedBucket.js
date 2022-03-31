const assert = require('assert');
const async = require('async');
const werelogs = require('werelogs');
const { MetadataWrapper } = require('arsenal').storage.metadata;
const { versioning } = require('arsenal');
const { BucketInfo } = require('arsenal').models;
const s3 = require('../../../s3SDK').scalityS3Client;

const logger = new werelogs.Logger('keyFormatVersion', 'debug', 'debug');
const { BucketVersioningKeyFormat } = versioning.VersioningConstants;

const IMPL_NAME = 'mongodb';
const BUCKET_NAME = {
    v0: 'key-format-non-versioned-bucket-v0',
    v1: 'key-format-non-versioned-bucket-v1',
};
const ownerInfo = {};

function putObjects(bucketName, cb) {
    async.timesSeries(10, (n, next) => {
        s3.putObject({ Bucket: bucketName, Key: `key-${n}` }, next);
    }, cb);
}

function emptyBucket(bucketName, cb) {
    async.timesSeries(10, (n, next) => {
        s3.deleteObject({ Bucket: bucketName, Key: `key-${n}` }, next);
    }, cb);
}

function expectedKeyList(startKey, endKey) {
    const expKeyList = [];
    for (let i = startKey; i <= endKey; i++) {
        expKeyList.push(`key-${i}`);
    }
    return expKeyList;
}

describe('Cloudserver : keyFormatVersion : non versioned bucket', () => {
    let metadata;

    function getBucketOwnerInfo(cb) {
        async.series([
            next => s3.createBucket({ Bucket: 'tmp-bucket' }, next),
            next => metadata.getBucket('tmp-bucket', logger, (err, res) => {
                if (err) {
                    return next(err);
                }
                ownerInfo._owner = res._owner;
                ownerInfo._ownerDisplayName = res._ownerDisplayName;
                return next();
            }),
            next => s3.deleteBucket({ Bucket: 'tmp-bucket' }, next),
        ], cb);
    }

    function createBucket(vFormat, cb) {
        const bucketMD = BucketInfo.fromObj({
            _name: BUCKET_NAME[vFormat],
            _owner: ownerInfo._owner,
            _ownerDisplayName: ownerInfo._ownerDisplayName,
            _creationDate: new Date().toJSON(),
            _acl: {
                Canned: 'private',
                FULL_CONTROL: [],
                WRITE: [],
                WRITE_ACP: [],
                READ: [],
                READ_ACP: [],
            },
            _mdBucketModelVersion: 10,
            _transient: false,
            _deleted: false,
            _serverSideEncryption: null,
            _versioningConfiguration: null,
            _locationConstraint: 'us-east-1',
            _readLocationConstraint: null,
            _cors: null,
            _replicationConfiguration: null,
            _lifecycleConfiguration: null,
            _uid: '',
            _isNFS: null,
            ingestion: null,
        });
        async.series([
            next => {
                metadata.client.defaultBucketKeyFormat = vFormat;
                return next();
            },
            next => metadata.createBucket(BUCKET_NAME[vFormat], bucketMD, logger, next),
        ], cb);
    }

    before(done => {
        async.series([
            next => {
                const opts = {
                    mongodb: {
                        replicaSetHosts: process.env.MONGO_REPLICA_SET_HOSTS,
                        // TODO: replace with env var
                        replicaSet: 'rs0',
                        writeConcern: process.env.MONGO_WRITE_CONCERN,
                        readPreference: process.env.MONGO_READ_PREFERENCE,
                        shardCollections: process.env.MONGO_SHARD_COLLECTION === 'true',
                        database: process.env.MONGO_DATABASE,
                        authCredentials: {
                            password: process.env.MONGO_AUTH_PASSWORD,
                            username: process.env.MONGO_AUTH_USERNAME,
                        },
                    },
                };
                metadata = new MetadataWrapper(IMPL_NAME, opts, null, logger);
                metadata.setup(next);
            },
            next => getBucketOwnerInfo(next),
            next => createBucket(BucketVersioningKeyFormat.v0, next),
            next => createBucket(BucketVersioningKeyFormat.v1, next),
            next => putObjects(BUCKET_NAME.v0, next),
            next => putObjects(BUCKET_NAME.v1, next),
        ], err => {
            assert.ifError(err);
            done();
        });
    });

    after(done => {
        async.series([
            next => emptyBucket(BUCKET_NAME.v0, next),
            next => emptyBucket(BUCKET_NAME.v1, next),
            next => s3.deleteBucket({ Bucket: BUCKET_NAME.v0 }, next),
            next => s3.deleteBucket({ Bucket: BUCKET_NAME.v1 }, next),
            next => metadata.close(next),
        ], err => {
            assert.ifError(err);
            done();
        });
    });

    ['v0', 'v1'].forEach(vFormat => {
        it(`Should return object metadata ${vFormat}`, done => {
            const params = {
                Bucket: BUCKET_NAME[vFormat],
                Key: 'key-2',
            };
            s3.getObject(params, (err, data) => {
                assert.ifError(err);
                assert(data);
                return done();
            });
        });

        it(`Should list all objects in bucket ${vFormat}`, done => {
            const params = {
                Bucket: BUCKET_NAME[vFormat],
            };
            s3.listObjectsV2(params, (err, data) => {
                assert.ifError(err);
                const keyList = [];
                data.Contents.forEach(object => keyList.push(object.Key));
                assert.deepStrictEqual(keyList, expectedKeyList(0, 9));
                return done();
            });
        });

        it(`Should only list object with prefix ${vFormat}`, done => {
            const params = {
                Bucket: BUCKET_NAME[vFormat],
                Prefix: 'key-2',
            };
            s3.listObjectsV2(params, (err, data) => {
                assert.ifError(err);
                assert.strictEqual(data.Contents.length, 1);
                assert.strictEqual(data.Contents[0].Key, 'key-2');
                return done();
            });
        });

        it(`Should remove object from bucket ${vFormat}`, done => {
            async.series([
                next => s3.putObject({ Bucket: BUCKET_NAME[vFormat], Key: 'key-to-delete' }, next),
                next => s3.deleteObject({ Bucket: BUCKET_NAME[vFormat], Key: 'key-to-delete' }, next),
                next => s3.getObject({ Bucket: BUCKET_NAME[vFormat], Key: 'key-to-delete' }, err => {
                    assert.strictEqual(err.code, 'NoSuchKey');
                    return next();
                }),
                next => s3.listObjectsV2({ Bucket: BUCKET_NAME[vFormat] }, (err, data) => {
                    assert.ifError(err);
                    assert.strictEqual(data.Contents.length, 10);
                    return next();
                }),
            ], done);
        });
    });
});
