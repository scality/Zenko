import { S3Client, CreateBucketCommand, PutBucketVersioningCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { BlobServiceClient, StorageSharedKeyCredential as BlobStorageSharedKeyCredential } from '@azure/storage-blob';
import { QueueServiceClient, StorageSharedKeyCredential } from '@azure/storage-queue';
import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';

export interface BucketsOptions {
    namespace: string;
    provider?: 'aws' | 'azure' | 'ring';
    dryRun?: boolean;
}

export async function setupBuckets(options: BucketsOptions): Promise<void> {
    const k8s = new KubernetesClient();

    if (!options.provider || options.provider === 'aws') {
        await setupAWSBuckets(k8s, options);
    }

    if (!options.provider || options.provider === 'azure') {
        await setupAzureBuckets(k8s, options);
    }

    if (!options.provider || options.provider === 'ring') {
        await setupRingBuckets(k8s, options);
    }
}

async function setupAWSBuckets(k8s: KubernetesClient, options: BucketsOptions): Promise<void> {
    logger.info('Creating AWS test buckets');

    // Get AWS credentials from mock service
    const awsSecret = await k8s.coreApi.readNamespacedSecret({
        name: 'aws-mock-credentials',
        namespace: options.namespace,
    });
    const awsConfig = {
        credentials: {
            accessKeyId: Buffer.from(awsSecret.data!['aws-access-key-id'], 'base64').toString(),
            secretAccessKey: Buffer.from(awsSecret.data!['aws-secret-access-key'], 'base64').toString()
        },
        region: Buffer.from(awsSecret.data!['aws-region'], 'base64').toString(),
        endpoint: Buffer.from(awsSecret.data!['aws-endpoint'], 'base64').toString(),
        forcePathStyle: true
    };

    const s3Client = new S3Client(awsConfig);

    // Standard test buckets
    const buckets = [
        'ci-zenko-aws-source-bucket',
        'ci-zenko-aws-target-bucket',
        'ci-zenko-aws-versioned-bucket',
        'ci-zenko-aws-lifecycle-bucket',
        'ci-zenko-aws-replication-bucket',
        'ci-zenko-aws-notification-bucket'
    ];

    for (const bucketName of buckets) {
        try {
            await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
            logger.debug(`Created bucket: ${bucketName}`);

            // Enable versioning on versioned and replication buckets
            if (bucketName.includes('versioned') || bucketName.includes('replication')) {
                await s3Client.send(new PutBucketVersioningCommand({
                    Bucket: bucketName,
                    VersioningConfiguration: {
                        Status: 'Enabled'
                    }
                }));
                logger.debug(`Enabled versioning on: ${bucketName}`);
            }

            // Add test objects to source bucket
            if (bucketName.includes('source')) {
                const testObjects = [
                    { Key: 'test-object-1.txt', Body: 'Test content 1' },
                    { Key: 'test-object-2.txt', Body: 'Test content 2' },
                    { Key: 'folder/nested-object.txt', Body: 'Nested content' }
                ];

                for (const obj of testObjects) {
                    await s3Client.send(new PutObjectCommand({
                        Bucket: bucketName,
                        Key: obj.Key,
                        Body: obj.Body
                    }));
                }
                logger.debug(`Added test objects to: ${bucketName}`);
            }

        } catch (error: any) {
            if (error.name === 'BucketAlreadyOwnedByYou' || error.name === 'BucketAlreadyExists') {
                logger.debug(`Bucket ${bucketName} already exists`);
            } else {
                logger.error(`Failed to create bucket ${bucketName}: ${error.message}`);
                throw error;
            }
        }
    }

    logger.info(`Created ${buckets.length} AWS test buckets`);
}

async function setupAzureBuckets(k8s: KubernetesClient, options: BucketsOptions): Promise<void> {
    logger.info('Creating Azure test containers and queues');

    // Get Azure credentials from mock service
    const azureSecret = await k8s.coreApi.readNamespacedSecret({
        name: 'azure-mock-credentials',
        namespace: options.namespace,
    });
    const accountName = Buffer.from(azureSecret.data!['account-name'], 'base64').toString();
    const accountKey = Buffer.from(azureSecret.data!['account-key'], 'base64').toString();
    const blobEndpoint = Buffer.from(azureSecret.data!['blob-endpoint'], 'base64').toString();
    const queueEndpoint = Buffer.from(azureSecret.data!['queue-endpoint'], 'base64').toString();

    const blobSharedKeyCredential = new BlobStorageSharedKeyCredential(accountName, accountKey);
    const queueSharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

    // Setup blob containers
    const blobServiceClient = new BlobServiceClient(blobEndpoint, blobSharedKeyCredential);

    const containers = [
        'ci-zenko-azure-source-container',
        'ci-zenko-azure-target-container',
        'ci-zenko-azure-archive-container',
        'ci-zenko-azure-lifecycle-container'
    ];

    for (const containerName of containers) {
        try {
            const containerClient = blobServiceClient.getContainerClient(containerName);
            await containerClient.create();
            logger.debug(`Created container: ${containerName}`);

            // Add test blobs to source container
            if (containerName.includes('source')) {
                const testBlobs = [
                    { name: 'test-blob-1.txt', content: 'Azure test content 1' },
                    { name: 'test-blob-2.txt', content: 'Azure test content 2' },
                    { name: 'folder/nested-blob.txt', content: 'Azure nested content' }
                ];

                for (const blob of testBlobs) {
                    const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
                    await blockBlobClient.upload(blob.content, blob.content.length);
                }
                logger.debug(`Added test blobs to: ${containerName}`);
            }

        } catch (error: any) {
            if (error.statusCode === 409) {
                logger.debug(`Container ${containerName} already exists`);
            } else {
                logger.error(`Failed to create container ${containerName}: ${error.message}`);
                throw error;
            }
        }
    }

    // Setup queues for notification testing
    const queueServiceClient = new QueueServiceClient(queueEndpoint, queueSharedKeyCredential);

    const queues = [
        'ci-zenko-azure-notifications-queue',
        'ci-zenko-azure-status-queue'
    ];

    for (const queueName of queues) {
        try {
            const queueClient = queueServiceClient.getQueueClient(queueName);
            await queueClient.create();
            logger.debug(`Created queue: ${queueName}`);
        } catch (error: any) {
            if (error.statusCode === 409) {
                logger.debug(`Queue ${queueName} already exists`);
            } else {
                logger.error(`Failed to create queue ${queueName}: ${error.message}`);
                throw error;
            }
        }
    }

    logger.info(`Created ${containers.length} Azure containers and ${queues.length} queues`);
}

async function setupRingBuckets(k8s: KubernetesClient, options: BucketsOptions): Promise<void> {
    logger.info('Creating Ring/S3C test buckets');

    // Ring buckets are typically created through S3 API against Ring storage
    // This would require Ring/S3C credentials and endpoint configuration
    // For now, create a placeholder configuration

    const ringConfig = {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: {
            name: 'ring-test-buckets',
            namespace: options.namespace
        },
        data: {
            'buckets.json': JSON.stringify([
                'ci-zenko-ring-source-bucket',
                'ci-zenko-ring-target-bucket',
                'ci-zenko-ring-archive-bucket'
            ], null, 2)
        }
    };

    await k8s.applyManifest(ringConfig, options.namespace);

    logger.info('Ring bucket configuration created (actual buckets require Ring/S3C setup)');
}