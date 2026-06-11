import {
    S3Client,
    PutBucketVersioningCommand,
    PutObjectCommand,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { Env } from '../../config';
import { createBucket } from './utils';

async function putObject(s3: S3Client, bucket: string, key: string, body: Buffer): Promise<void> {
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body }));
}

async function putSinglepartMpu(s3: S3Client, bucket: string, key: string, body: Buffer): Promise<void> {
    const mpu = await s3.send(new CreateMultipartUploadCommand({ Bucket: bucket, Key: key }));
    const part = await s3.send(new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        PartNumber: 1,
        UploadId: mpu.UploadId!,
        Body: body,
    }));
    await s3.send(new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: mpu.UploadId!,
        MultipartUpload: { Parts: [{ PartNumber: 1, ETag: part.ETag! }] },
    }));
}

export async function createRingBuckets(env: Env): Promise<void> {
    if (!env.ENABLE_RING_TESTS) {
        return;
    }
    if (!env.RING_S3C_ACCESS_KEY || !env.RING_S3C_SECRET_KEY) {
        console.log('Skipping Ring S3C buckets: no credentials provided');
        return;
    }

    const s3 = new S3Client({
        credentials: {
            accessKeyId: env.RING_S3C_ACCESS_KEY,
            secretAccessKey: env.RING_S3C_SECRET_KEY,
        },
        endpoint: env.RING_S3C_ENDPOINT,
        region: 'us-east-1',
        forcePathStyle: true,
    });

    if (!env.RING_S3C_INGESTION_SRC_BUCKET_NAME || !env.RING_S3C_INGESTION_SRC_NON_VERSIONED_BUCKET_NAME) {
        throw new Error(
            'RING_S3C_INGESTION_SRC_BUCKET_NAME and RING_S3C_INGESTION_SRC_NON_VERSIONED_BUCKET_NAME' +
            ' are required when Ring S3C credentials are provided',
        );
    }

    const versionedBucket = env.RING_S3C_INGESTION_SRC_BUCKET_NAME;
    const nonVersionedBucket = env.RING_S3C_INGESTION_SRC_NON_VERSIONED_BUCKET_NAME;
    if (env.RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE === undefined) {
        throw new Error(
            'RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE is required when Ring S3C credentials are provided',
        );
    }
    const objectCount = env.RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE;

    await createBucket(s3, versionedBucket);
    await createBucket(s3, nonVersionedBucket);

    // Pre-populate non-versioned objects before enabling versioning.
    // A Ring S3C location can only be created against a versioned bucket,
    // but once versioning is enabled it cannot be disabled, so we seed
    // non-versioned objects first.
    console.log('Putting non-versioned objects into Ring S3C bucket...');
    for (let i = 0; i < objectCount; i++) {
        await putObject(s3, nonVersionedBucket, `simple-${i}`, Buffer.from('data'));
        await putObject(s3, nonVersionedBucket, `zerobyte-${i}`, Buffer.alloc(0));
        await putSinglepartMpu(s3, nonVersionedBucket, `mpu-singlepart-${i}`, Buffer.from('mpudata'));
    }

    console.log('Enabling versioning on Ring S3C buckets...');
    for (const bucket of [versionedBucket, nonVersionedBucket]) {
        await s3.send(new PutBucketVersioningCommand({
            Bucket: bucket,
            VersioningConfiguration: { Status: 'Enabled' },
        }));
    }
}
