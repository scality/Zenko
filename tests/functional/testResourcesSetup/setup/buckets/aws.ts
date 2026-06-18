import { S3Client, PutBucketVersioningCommand } from '@aws-sdk/client-s3';
import { Env } from '../../config';
import { createBucket } from './utils';

export async function createAwsBuckets(env: Env): Promise<void> {
    if (!env.AWS_ACCESS_KEY || !env.AWS_SECRET_KEY) {
        console.log('Skipping AWS buckets: no credentials provided');
        return;
    }

    if (!env.AWS_FAIL_BUCKET_NAME || !env.AWS_REPLICATION_FAIL_CTST_BUCKET_NAME) {
        throw new Error(
            'AWS_FAIL_BUCKET_NAME and AWS_REPLICATION_FAIL_CTST_BUCKET_NAME' +
            ' are required when AWS credentials are provided',
        );
    }

    const s3 = new S3Client({
        credentials: {
            accessKeyId: env.AWS_ACCESS_KEY,
            secretAccessKey: env.AWS_SECRET_KEY,
        },
        endpoint: env.AWS_ENDPOINT,
        region: 'us-east-1',
        forcePathStyle: true,
    });

    for (const bucketName of [env.AWS_FAIL_BUCKET_NAME, env.AWS_REPLICATION_FAIL_CTST_BUCKET_NAME]) {
        await createBucket(s3, bucketName);
        await s3.send(new PutBucketVersioningCommand({
            Bucket: bucketName,
            VersioningConfiguration: { Status: 'Enabled' },
        }));
    }
}
