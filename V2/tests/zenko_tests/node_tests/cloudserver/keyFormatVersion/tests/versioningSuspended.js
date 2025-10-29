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
    v0: 'key-format-versioning-suspended-bucket-v0',
    v1: 'key-format-versioning-suspended-bucket-v1',
};
const versionIds = {
    v0: {
        'first-key': [],
        'second-key': [],
    },
    v1: {
        'first-key': [],
        'second-key': [],
    },
};
const ownerInfo = {};

function putObjectVersions(objName, vFormat, cb) {
    async.timesSeries(3, (n, next) => {
        s3.putObject({ Bucket: BUCKET_NAME[vFormat], Key: objName }, (err, res) => {
            assert.ifError(err);
            versionIds[vFormat][objName].push(res.VersionId);
            return next();
        });
    }, cb);
}

function deleteObjectVersions(objName, vFormat, cb) {
    async.timesSeries(3, (n, next) => {
        s3.deleteObject({
            Bucket: BUCKET_NAME[vFormat],
            Key: objName,
            VersionId: versionIds[vFormat][objName][n],
        }, next);
    }, cb);
}

describe('Cloudserver : keyFormatVersion : versioning suspended bucket', () => {
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

    function createAndPopulateVersionedBucket(vFormat, cb) {
        async.series([
            next => createBucket(vFormat, next),
            next => {
                const params = {
                    Bucket: BUCKET_NAME[vFormat],
                    VersioningConfiguration: {
                        MFADelete: 'Disabled',
                        Status: 'Enabled',
                    },
                };
                return s3.putBucketVersioning(params, next);
            },
            next => putObjectVersions('first-key', vFormat, next),
            next => putObjectVersions('second-key', vFormat, next),
        ], cb);
    }

    function suspendBucketVersioning(vFormat, cb) {
        const params = {
            Bucket: BUCKET_NAME[vFormat],
            VersioningConfiguration: {
                MFADelete: 'Disabled',
                Status: 'Suspended',
            },
        };
        return s3.putBucketVersioning(params, cb);
    }

    function emptyAndDeleteBucket(vFormat, cb) {
        async.series([
            next => deleteObjectVersions('first-key', vFormat, next),
            next => deleteObjectVersions('second-key', vFormat, next),
            next => s3.deleteBucket({ Bucket: BUCKET_NAME[vFormat] }, next),
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
            next => createAndPopulateVersionedBucket(BucketVersioningKeyFormat.v0, next),
            next => createAndPopulateVersionedBucket(BucketVersioningKeyFormat.v1, next),
            next => suspendBucketVersioning(BucketVersioningKeyFormat.v0, next),
            next => suspendBucketVersioning(BucketVersioningKeyFormat.v1, next),
        ], err => {
            assert.ifError(err);
            done();
        });
    });

    after(done => {
        async.series([
            next => emptyAndDeleteBucket(BucketVersioningKeyFormat.v0, next),
            next => emptyAndDeleteBucket(BucketVersioningKeyFormat.v1, next),
            next => metadata.close(next),
        ], err => {
            assert.ifError(err);
            done();
        });
    });

    ['v0', 'v1'].forEach(vFormat => {
        it(`Should create new null version ${vFormat}`, done => {
            async.series([
                next => s3.putObject({ Bucket: BUCKET_NAME[vFormat], Key: 'first-key' }, next),
                next => s3.getObject(
                    { Bucket: BUCKET_NAME[vFormat], Key: 'first-key', VersionId: 'null' },
                    (err, data) => {
                        assert.ifError(err);
                        assert.strictEqual(data.VersionId, 'null');
                        return next();
                    },
                ),
                next => s3.deleteObject({ Bucket: BUCKET_NAME[vFormat], Key: 'first-key', VersionId: 'null' }, next),
            ], done);
        });

        it(`Should not list DeleteMarkers ${vFormat}`, done => {
            const key = 'first-key-test-delete-marker';

            let countObjects = 0;
            async.series([
                next => s3.putObject({ Bucket: BUCKET_NAME[vFormat], Key: key }, next),
                next => s3.listObjectsV2({ Bucket: BUCKET_NAME[vFormat] }, (err, data) => {
                    countObjects = data.Contents.length;
                    assert.strictEqual(data.Contents.some(c => c.Key === key), true);
                    return next(err);
                }),
                next => s3.deleteObject({ Bucket: BUCKET_NAME[vFormat], Key: key }, next),
                next => s3.listObjectsV2({ Bucket: BUCKET_NAME[vFormat] }, (err, data) => {
                    assert.strictEqual(data.Contents.length, countObjects - 1);
                    assert.strictEqual(data.Contents.some(c => c.Key === key), false);
                    return next(err);
                }),
                next => s3.deleteObject({ Bucket: BUCKET_NAME[vFormat], Key: key, VersionId: 'null' }, next),
            ], done);
        });

        it(`Should return metadata of last version ${vFormat}`, done => {
            const params = {
                Bucket: BUCKET_NAME[vFormat],
                Key: 'first-key',
            };
            s3.getObject(params, (err, data) => {
                assert.ifError(err);
                assert.strictEqual(data.VersionId, versionIds[vFormat]['first-key'][2]);
                return done();
            });
        });

        it(`Should return metadata of specified version ${vFormat}`, done => {
            const params = {
                Bucket: BUCKET_NAME[vFormat],
                Key: 'second-key',
                VersionId: versionIds[vFormat]['second-key'][1],
            };
            s3.getObject(params, (err, data) => {
                assert.ifError(err);
                assert.strictEqual(data.VersionId, versionIds[vFormat]['second-key'][1]);
                return done();
            });
        });

        it(`Should only list last versions ${vFormat}`, done => {
            const params = {
                Bucket: BUCKET_NAME[vFormat],
            };
            s3.listObjectsV2(params, (err, data) => {
                assert.ifError(err);
                assert.strictEqual(data.Contents.length, 2);
                const keys = data.Contents.map(object => object.Key);
                assert(keys.includes('first-key'));
                assert(keys.includes('second-key'));
                return done();
            });
        });

        it(`Should list all versions ${vFormat}`, done => {
            const params = {
                Bucket: BUCKET_NAME[vFormat],
            };
            s3.listObjectVersions(params, (err, data) => {
                assert.ifError(err);
                assert.strictEqual(data.Versions.length, 6);
                const versions = data.Versions.map(object => object.VersionId);
                assert(versionIds[vFormat]['first-key'].every(version => versions.includes(version)));
                assert(versionIds[vFormat]['second-key'].every(version => versions.includes(version)));
                return done();
            });
        });

        it(`Should delete specified version ${vFormat}`, done => {
            let tmpVersionId;
            async.series([
                next => s3.putObject({ Bucket: BUCKET_NAME[vFormat], Key: 'first-key' }, (err, res) => {
                    assert.ifError(err);
                    tmpVersionId = res.VersionId;
                    return next();
                }),
                next => s3.deleteObject({
                    Bucket: BUCKET_NAME[vFormat],
                    Key: 'first-key',
                    VersionId: tmpVersionId,
                }, next),
                next => s3.getObject({
                    Bucket: BUCKET_NAME[vFormat],
                    Key: 'first-key',
                    VersionId: tmpVersionId,
                }, err => {
                    assert.strictEqual(err.code, 'NoSuchKey');
                    return next();
                }),
            ], done);
        });

        it(`Should create a delete marker with null versionId ${vFormat}`, done => {
            async.series([
                next => s3.deleteObject({ Bucket: BUCKET_NAME[vFormat], Key: 'first-key' }, (err, data) => {
                    assert.ifError(err);
                    assert(data.DeleteMarker);
                    assert.strictEqual(data.VersionId, 'null');
                    return next();
                }),
                next => s3.getObject({ Bucket: BUCKET_NAME[vFormat], Key: 'first-key' }, err => {
                    assert.strictEqual(err.code, 'NoSuchKey');
                    return next();
                }),
                next => s3.deleteObject({ Bucket: BUCKET_NAME[vFormat], Key: 'first-key', VersionId: 'null' }, next),
            ], done);
        });
    });
});
