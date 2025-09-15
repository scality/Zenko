import { S3Client, CreateBucketCommand, PutBucketVersioningCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { BlobServiceClient, StorageSharedKeyCredential as BlobStorageSharedKeyCredential } from '@azure/storage-blob';
import { QueueServiceClient, StorageSharedKeyCredential } from '@azure/storage-queue';
import { KubernetesClient } from './utils/k8s';
import { logger } from './utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export interface BucketObject {
    key: string;
    body: string;
}

export interface AWSBucket {
    name: string;
    versioning: boolean;
    objects: BucketObject[];
}

export interface AzureBlob {
    name: string;
    content: string;
}

export interface AzureContainer {
    name: string;
    blobs: AzureBlob[];
}

export interface AzureQueue {
    name: string;
}

export interface RingBucket {
    name: string;
    objects: BucketObject[];
}

export interface BucketsConfig {
    aws: {
        buckets: AWSBucket[];
    };
    azure: {
        containers: AzureContainer[];
        queues: AzureQueue[];
    };
    ring: {
        buckets: RingBucket[];
    };
}

export interface BucketsOptions {
    namespace: string;
    provider?: 'aws' | 'azure' | 'ring';
    configFile?: string;
}

function loadBucketsConfig(configFile?: string): BucketsConfig {
    const defaultConfigPath = path.join(__dirname, '..', 'configs', 'buckets.json');
    const configPath = configFile ? path.resolve(configFile) : defaultConfigPath;
    
    if (!fs.existsSync(configPath)) {
        throw new Error(`Buckets configuration file not found: ${configPath}`);
    }
    
    try {
        const configData = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(configData) as BucketsConfig;
    } catch (error) {
        throw new Error(`Failed to parse buckets configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function setupBuckets(options: BucketsOptions): Promise<void> {
    const k8s = new KubernetesClient();
    const config = loadBucketsConfig(options.configFile);

    if (!options.provider || options.provider === 'aws') {
        await setupAWSBuckets(k8s, options, config.aws.buckets);
    }

    if (!options.provider || options.provider === 'azure') {
        await setupAzureBuckets(k8s, options, config.azure);
    }

    if (!options.provider || options.provider === 'ring') {
        await setupRingBuckets(k8s, options, config.ring.buckets);
    }
}

async function setupAWSBuckets(k8s: KubernetesClient, options: BucketsOptions, buckets: AWSBucket[]): Promise<void> {
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

    for (const bucket of buckets) {
        try {
            await s3Client.send(new CreateBucketCommand({ Bucket: bucket.name }));
            logger.debug(`Created bucket: ${bucket.name}`);

            // Enable versioning if specified
            if (bucket.versioning) {
                await s3Client.send(new PutBucketVersioningCommand({
                    Bucket: bucket.name,
                    VersioningConfiguration: {
                        Status: 'Enabled'
                    }
                }));
                logger.debug(`Enabled versioning on: ${bucket.name}`);
            }

            // Add test objects from configuration
            for (const obj of bucket.objects) {
                await s3Client.send(new PutObjectCommand({
                    Bucket: bucket.name,
                    Key: obj.key,
                    Body: obj.body
                }));
            }
            
            if (bucket.objects.length > 0) {
                logger.debug(`Added ${bucket.objects.length} test objects to: ${bucket.name}`);
            }

        } catch (error: any) {
            if (error.name === 'BucketAlreadyOwnedByYou' || error.name === 'BucketAlreadyExists') {
                logger.debug(`Bucket ${bucket.name} already exists`);
            } else {
                logger.error(`Failed to create bucket ${bucket.name}: ${error.message}`);
                throw error;
            }
        }
    }

    logger.info(`Created ${buckets.length} AWS test buckets`);
}

async function setupAzureBuckets(k8s: KubernetesClient, options: BucketsOptions, azureConfig: { containers: AzureContainer[]; queues: AzureQueue[] }): Promise<void> {
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

    for (const container of azureConfig.containers) {
        try {
            const containerClient = blobServiceClient.getContainerClient(container.name);
            await containerClient.create();
            logger.debug(`Created container: ${container.name}`);

            // Add blobs from configuration
            for (const blob of container.blobs) {
                const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
                await blockBlobClient.upload(blob.content, blob.content.length);
            }
            
            if (container.blobs.length > 0) {
                logger.debug(`Added ${container.blobs.length} test blobs to: ${container.name}`);
            }

        } catch (error: any) {
            if (error.statusCode === 409) {
                logger.debug(`Container ${container.name} already exists`);
            } else {
                logger.error(`Failed to create container ${container.name}: ${error.message}`);
                throw error;
            }
        }
    }

    // Setup queues from configuration
    const queueServiceClient = new QueueServiceClient(queueEndpoint, queueSharedKeyCredential);

    for (const queue of azureConfig.queues) {
        try {
            const queueClient = queueServiceClient.getQueueClient(queue.name);
            await queueClient.create();
            logger.debug(`Created queue: ${queue.name}`);
        } catch (error: any) {
            if (error.statusCode === 409) {
                logger.debug(`Queue ${queue.name} already exists`);
            } else {
                logger.error(`Failed to create queue ${queue.name}: ${error.message}`);
                throw error;
            }
        }
    }

    logger.info(`Created ${azureConfig.containers.length} Azure containers and ${azureConfig.queues.length} queues`);
}

async function setupRingBuckets(k8s: KubernetesClient, options: BucketsOptions, buckets: RingBucket[]): Promise<void> {
    logger.info('Creating Ring/S3C test buckets');

    // Ring buckets are typically created through S3 API against Ring storage
    // This would require Ring/S3C credentials and endpoint configuration
    // For now, create a configuration based on the input buckets

    const ringConfig = {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: {
            name: 'ring-test-buckets',
            namespace: options.namespace
        },
        data: {
            'buckets.json': JSON.stringify(buckets.map(bucket => ({
                name: bucket.name,
                objects: bucket.objects
            })), null, 2)
        }
    };

    await k8s.applyManifest(ringConfig, options.namespace);

    logger.info(`Ring bucket configuration created for ${buckets.length} buckets (actual buckets require Ring/S3C setup)`);
}