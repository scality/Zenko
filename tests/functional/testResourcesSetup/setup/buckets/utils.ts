import { S3Client, CreateBucketCommand, S3ServiceException } from '@aws-sdk/client-s3';

export async function createBucket(s3: S3Client, bucketName: string): Promise<void> {
    console.log(`Creating bucket: ${bucketName}`);
    try {
        await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
    } catch (err) {
        if (err instanceof S3ServiceException && err.name === 'BucketAlreadyOwnedByYou') {
            console.log(`Bucket already exists: ${bucketName}`);
        } else {
            throw err;
        }
    }
}
