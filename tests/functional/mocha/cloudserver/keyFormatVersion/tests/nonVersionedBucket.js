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
} = require('@aws-sdk/client-s3');
const { config } = require('tests_common/configuration');
let s3;

const logger = new werelogs.Logger('keyFormatVersion', 'debug', 'debug');
const { BucketVersioningKeyFormat } = versioning.VersioningConstants;

const IMPL_NAME = 'mongodb';
const BUCKET_NAME = {
    v0: 'key-format-non-versioned-bucket-v0',
    v1: 'key-format-non-versioned-bucket-v1',
};
const ownerInfo = {};

async function putObjects(bucketName) {
    await Promise.all(Array.from({ length: 10 }, (_, n) => s3.send(new PutObjectCommand(
        {
            Bucket: bucketName,
            Key: `key-${n}`,
            Body: '',
            ContentLength: 0,
        },
    ))));
}

async function emptyBucket(bucketName) {
    await Promise.all(Array.from({ length: 10 }, (_, n) => s3.send(new DeleteObjectCommand(
        { Bucket: bucketName, Key: `key-${n}` },
    ))));
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

    async function getBucketOwnerInfo() {
        await s3.send(new CreateBucketCommand({ Bucket: 'tmp-bucket' }));
        const bucketInfo = await new Promise((resolve, reject) => {
            metadata.getBucket('tmp-bucket', logger, (err, res) => (err ? reject(err) : resolve(res)));
        });
        ownerInfo._owner = bucketInfo._owner;
        ownerInfo._ownerDisplayName = bucketInfo._ownerDisplayName;
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

    before(async () => {
        s3 = config.ZenkoAccount.s3Client;
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
        await createBucket(BucketVersioningKeyFormat.v0);
        await createBucket(BucketVersioningKeyFormat.v1);
        await putObjects(BUCKET_NAME.v0);
        await putObjects(BUCKET_NAME.v1);
    });

    after(async () => {
        await emptyBucket(BUCKET_NAME.v0);
        await emptyBucket(BUCKET_NAME.v1);
        await s3.send(new DeleteBucketCommand({ Bucket: BUCKET_NAME.v0 }));
        await s3.send(new DeleteBucketCommand({ Bucket: BUCKET_NAME.v1 }));

        await new Promise((resolve, reject) => {
            metadata.close(err => (err ? reject(err) : resolve()));
        });
    });

    ['v0', 'v1'].forEach(vFormat => {
        it(`Should return object metadata ${vFormat}`, async () => {
            const params = {
                Bucket: BUCKET_NAME[vFormat],
                Key: 'key-2',
            };
            const data = await s3.send(new GetObjectCommand(params));
            assert(data);
        });

        it(`Should list all objects in bucket ${vFormat}`, async () => {
            const params = {
                Bucket: BUCKET_NAME[vFormat],
            };
            const data = await s3.send(new ListObjectsV2Command(params));
            const keyList = [];
            data.Contents.forEach(object => keyList.push(object.Key));
            assert.deepStrictEqual(keyList, expectedKeyList(0, 9));
        });

        it(`Should only list object with prefix ${vFormat}`, async () => {
            const params = {
                Bucket: BUCKET_NAME[vFormat],
                Prefix: 'key-2',
            };
            const data = await s3.send(new ListObjectsV2Command(params));
            assert.strictEqual(data.Contents.length, 1);
            assert.strictEqual(data.Contents[0].Key, 'key-2');
        });

        it(`Should remove object from bucket ${vFormat}`, async () => {
            await s3.send(new PutObjectCommand({
                Bucket: BUCKET_NAME[vFormat],
                Key: 'key-to-delete',
                Body: '',
                ContentLength: 0,
            }));
            await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME[vFormat], Key: 'key-to-delete' }));

            try {
                await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME[vFormat], Key: 'key-to-delete' }));
                throw new Error('Expected NoSuchKey error');
            } catch (err) {
                if (err.name !== 'NoSuchKey') {
                    throw err;
                }
            }

            const data = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME[vFormat] }));
            assert.strictEqual(data.Contents.length, 10);
        });
    });
});
