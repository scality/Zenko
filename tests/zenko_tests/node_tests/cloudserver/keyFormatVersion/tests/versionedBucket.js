const assert = require('assert');
const werelogs = require('werelogs');
const { MetadataWrapper } = require('arsenal').storage.metadata;
const { versioning } = require('arsenal');
const { BucketInfo } = require('arsenal').models;
const {
    CreateBucketCommand,
    DeleteBucketCommand,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    ListObjectVersionsCommand,
    PutBucketVersioningCommand,
} = require('@aws-sdk/client-s3');
const s3 = require('../../../s3SDK').scalityS3Client;

const logger = new werelogs.Logger('keyFormatVersion', 'debug', 'debug');
const { BucketVersioningKeyFormat } = versioning.VersioningConstants;

const IMPL_NAME = 'mongodb';
const BUCKET_NAME = {
    v0: 'key-format-versioned-bucket-v0',
    v1: 'key-format-versioned-bucket-v1',
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

async function putObjectVersions(objName, vFormat) {
    for (let i = 0; i < 3; i++) {
        // eslint-disable-next-line no-await-in-loop
        const result = await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME[vFormat],
            Key: objName,
            Body: '',
            ContentLength: 0,
        }));
        versionIds[vFormat][objName].push(result.VersionId);
    }
}

async function deleteObjectVersions(objName, vFormat) {
    const promises = Array.from({ length: 3 }, (_, i) => s3.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME[vFormat],
        Key: objName,
        VersionId: versionIds[vFormat][objName][i],
    })));
    await Promise.all(promises);
}

describe('Cloudserver : keyFormatVersion : versioned bucket', () => {
    let metadata;

    async function getBucketOwnerInfo() {
        await s3.send(new CreateBucketCommand({ Bucket: 'tmp-bucket' }));
        const res = await new Promise((resolve, reject) => {
            metadata.getBucket('tmp-bucket', logger, (err, result) => (err ? reject(err) : resolve(result)));
        });
        ownerInfo._owner = res._owner;
        ownerInfo._ownerDisplayName = res._ownerDisplayName;
        await s3.send(new DeleteBucketCommand({ Bucket: 'tmp-bucket' }));
    }

    async function createBucket(vFormat) {
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

        metadata.client.defaultBucketKeyFormat = vFormat;
        await new Promise((resolve, reject) => {
            metadata.createBucket(BUCKET_NAME[vFormat], bucketMD, logger, err => (err ? reject(err) : resolve()));
        });
    }

    async function createAndPopulateVersionedBucket(vFormat) {
        await createBucket(vFormat);
        const params = {
            Bucket: BUCKET_NAME[vFormat],
            VersioningConfiguration: {
                MFADelete: 'Disabled',
                Status: 'Enabled',
            },
        };
        await s3.send(new PutBucketVersioningCommand(params));
        await putObjectVersions('first-key', vFormat);
        await putObjectVersions('second-key', vFormat);
    }

    async function emptyAndDeleteBucket(vFormat) {
        await deleteObjectVersions('first-key', vFormat);
        await deleteObjectVersions('second-key', vFormat);
        await s3.send(new DeleteBucketCommand({ Bucket: BUCKET_NAME[vFormat] }));
    }

    before(async () => {
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
        await new Promise((resolve, reject) => {
            metadata.setup(err => (err ? reject(err) : resolve()));
        });
        await getBucketOwnerInfo();
        await createAndPopulateVersionedBucket(BucketVersioningKeyFormat.v0);
        await createAndPopulateVersionedBucket(BucketVersioningKeyFormat.v1);
    });

    after(async () => {
        await emptyAndDeleteBucket(BucketVersioningKeyFormat.v0);
        await emptyAndDeleteBucket(BucketVersioningKeyFormat.v1);
        await new Promise((resolve, reject) => {
            metadata.close(err => (err ? reject(err) : resolve()));
        });
    });

    ['v0', 'v1'].forEach(vFormat => {
        it(`Should return metadata of last version ${vFormat}`, async () => {
            const params = {
                Bucket: BUCKET_NAME[vFormat],
                Key: 'first-key',
            };
            const data = await s3.send(new GetObjectCommand(params));
            assert.strictEqual(data.VersionId, versionIds[vFormat]['first-key'][2]);
        });

        it(`Should return metadata of specified version ${vFormat}`, async () => {
            const params = {
                Bucket: BUCKET_NAME[vFormat],
                Key: 'second-key',
                VersionId: versionIds[vFormat]['second-key'][1],
            };
            const data = await s3.send(new GetObjectCommand(params));
            assert.strictEqual(data.VersionId, versionIds[vFormat]['second-key'][1]);
        });

        it(`Should only list last versions ${vFormat}`, async () => {
            const params = {
                Bucket: BUCKET_NAME[vFormat],
            };
            const data = await s3.send(new ListObjectsV2Command(params));
            assert.strictEqual(data.Contents.length, 2);
            const keys = data.Contents.map(object => object.Key);
            assert(keys.includes('first-key'));
            assert(keys.includes('second-key'));
        });

        it(`Should list all versions ${vFormat}`, async () => {
            const params = {
                Bucket: BUCKET_NAME[vFormat],
            };
            const data = await s3.send(new ListObjectVersionsCommand(params));
            assert.strictEqual(data.Versions.length, 6);
            const versions = data.Versions.map(object => object.VersionId);
            assert(versionIds[vFormat]['first-key'].every(version => versions.includes(version)));
            assert(versionIds[vFormat]['second-key'].every(version => versions.includes(version)));
            const keyCount = {};
            data.Versions.forEach(object => {
                keyCount[object.Key] = (keyCount[object.Key] | 0) + 1;
            });
            assert(keyCount['second-key'], 3);
            assert(keyCount['second-key'], 3);
        });

        it(`Should delete specified version ${vFormat}`, async () => {
            const res = await s3.send(new PutObjectCommand({
                Bucket: BUCKET_NAME[vFormat],
                Key: 'first-key',
                Body: '',
                ContentLength: 0,
            }));
            const tmpVersionId = res.VersionId;

            await s3.send(new DeleteObjectCommand({
                Bucket: BUCKET_NAME[vFormat],
                Key: 'first-key',
                VersionId: tmpVersionId,
            }));

            try {
                await s3.send(new GetObjectCommand({
                    Bucket: BUCKET_NAME[vFormat],
                    Key: 'first-key',
                    VersionId: tmpVersionId,
                }));
                throw new Error('Expected NoSuchVersion error');
            } catch (err) {
                assert.strictEqual(err.name, 'NoSuchVersion');
            }
        });

        it(`Should create a delete marker ${vFormat}`, async () => {
            const deleteData = await s3.send(new DeleteObjectCommand(
                { Bucket: BUCKET_NAME[vFormat], Key: 'first-key' },
            ));
            assert(deleteData.DeleteMarker);
            const deleteMarkerVersionId = deleteData.VersionId;

            try {
                await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME[vFormat], Key: 'first-key' }));
                throw new Error('Expected NoSuchKey error');
            } catch (err) {
                assert.strictEqual(err.name, 'NoSuchKey');
            }

            const listData = await s3.send(new ListObjectVersionsCommand({ Bucket: BUCKET_NAME[vFormat] }));
            assert.strictEqual(listData.DeleteMarkers.length, 1);
            assert.strictEqual(listData.DeleteMarkers[0].Key, 'first-key');
            assert.strictEqual(listData.DeleteMarkers[0].VersionId, deleteMarkerVersionId);

            await s3.send(new DeleteObjectCommand({
                Bucket: BUCKET_NAME[vFormat],
                Key: 'first-key',
                VersionId: deleteMarkerVersionId,
            }));
        });
    });
});
