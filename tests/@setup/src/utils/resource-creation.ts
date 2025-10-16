import {
    S3Client,
    CreateBucketCommand,
    PutBucketVersioningCommand,
    HeadBucketCommand,
    PutObjectCommand,
    NoSuchBucket,
} from '@aws-sdk/client-s3';
import {
    BlobServiceClient,
    StorageSharedKeyCredential as BlobStorageSharedKeyCredential,
} from '@azure/storage-blob';
import {
    QueueServiceClient,
    StorageSharedKeyCredential as QueueStorageSharedKeyCredential,
} from '@azure/storage-queue';
import { logger } from './logger';
import { sleep } from 'cli-testing/utils/utils';

export interface StorageLocation {
    name: string;
    locationType: string;
    bootstrapIngestion?: boolean;
    createResources?: {
        createBucket?: boolean;
        createContainer?: boolean;
        createQueue?: boolean;
        enableVersioning?: boolean;
        addTestObjects?: boolean;
        skipLocationCreation?: boolean;
    };
    legacyAwsBehavior?: boolean;
    details: any;
}

/**
 * Retry an operation with exponential backoff
 */
async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 10
): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            // Retry on server errors, internal errors, or service not ready (HTML responses, deserialization errors)
            const isServerError = error.$metadata?.httpStatusCode >= 500;
            const isInternalError = error.name === 'InternalError';
            const isServiceNotReady = error.message?.includes('Deserialization error') || 
                                      error.message?.includes('Expected closing tag') ||
                                      error.message?.includes('UnknownError') ||
                                      error.code === 'ECONNREFUSED' ||
                                      error.code === 'ECONNRESET' ||
                                      error.code === 'ETIMEDOUT';
            const isRetryable = isServerError || isInternalError || isServiceNotReady;
            
            if (attempt < maxRetries && isRetryable) {
                // Exponential backoff with max delay cap of 10 seconds
                const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                logger.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`, {
                    error: error.message
                });
                await new Promise(resolve => setTimeout(resolve, delayMs));
            } else {
                throw error;
            }
        }
    }
    throw new Error('Retry logic failed unexpectedly');
}

/**
 * Check if S3 bucket exists
 */
async function checkBucketExists(s3Client: S3Client, bucketName: string): Promise<boolean> {
    try {
        await retryOperation(async () => {
            await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
        });
        return true;
    } catch (error: any) {
        if (error instanceof NoSuchBucket || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        // Other errors (permissions, network, etc.) - log and treat as unknown
        logger.warn(`Could not check if bucket ${bucketName} exists: ${error.name || error.message}`);
        return false;
    }
}

/**
 * Recursively resolve env: prefixes in an object
 * Supports formats:
 * - env:VAR_NAME - uses env var or returns original value if not set
 * @param obj - Object, array, or string to resolve
 * @returns Resolved value
 */
export function resolveEnvValues(obj: any): any {
    if (typeof obj === 'string' && obj.startsWith('env:')) {
        const parts = obj.split(':');
        const secretName = parts[1];
        const secretValue = process.env[secretName];

        if (secretValue === undefined) {
            logger.warn(`Environment variable "${secretName}" is not set`);
            return obj;
        }

        return secretValue;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => resolveEnvValues(item));
    }

    if (typeof obj === 'object' && obj !== null) {
        const resolved: any = {};
        for (const key in obj) {
            resolved[key] = resolveEnvValues(obj[key]);
        }
        return resolved;
    }

    return obj;
}

/**
 * Create resources for storage locations
 * @param locations - Storage locations
 */
export async function createResourcesForLocations(locations: StorageLocation[]): Promise<void> {
    logger.info('Creating resources for storage locations...');

    for (const location of locations) {
        const { createResources, details } = location;

        if (!createResources || !details) {
            continue;
        }

        try {
            logger.info(`Processing resources for location: ${location.name}`);

            // Create S3 bucket if requested
            if (createResources.createBucket) {
                await createS3Bucket(location);
            }

            // Create Azure container if requested
            if (createResources.createContainer) {
                await createAzureContainer(location);
            }

            // Create Azure queue if requested
            if (createResources.createQueue) {
                await createAzureQueue(location);
            }
        } catch (error) {
            logger.error(`Failed to create resources for location ${location.name}`, { error });
            throw error;
        }
    }

    logger.info('All location resources created successfully');
}

/**
 * Create S3 bucket
 * @param location - Storage location
 */
async function createS3Bucket(location: StorageLocation): Promise<void> {
    const { details, createResources } = location;

    const accessKey = resolveEnvValues(details.accessKey);
    const secretKey = resolveEnvValues(details.secretKey);
    const bucketName = resolveEnvValues(details.bucketName);
    const endpoint = resolveEnvValues(details.endpoint);

    if (!accessKey || !secretKey || !bucketName || !endpoint) {
        logger.warn(`Missing S3 credentials or config for location ${location.name}, skipping bucket creation`);
        return;
    }

    const s3Client = new S3Client({
        endpoint,
        credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
        },
        region: 'us-east-1',
        forcePathStyle: true,
        tls: endpoint.startsWith('https:'),
    });

    // Check if bucket exists, create if not
    const exists = await checkBucketExists(s3Client, bucketName);
    
    if (!exists) {
        logger.info(`Creating S3 bucket: ${bucketName}`);
        await retryOperation(() => s3Client.send(new CreateBucketCommand({ Bucket: bucketName })));
        logger.info(`Created S3 bucket: ${bucketName}`);
    } else {
        logger.info(`S3 bucket ${bucketName} already exists`);
    }

    // Add test objects if requested (before versioning)
    if (createResources?.addTestObjects) {
        await addTestObjects(s3Client, bucketName);
    }

    // Enable versioning if requested
    if (createResources?.enableVersioning) {
        logger.info(`Enabling versioning on bucket: ${bucketName}`);
        await s3Client.send(new PutBucketVersioningCommand({
            Bucket: bucketName,
            VersioningConfiguration: {
                Status: 'Enabled',
            },
        }));
        logger.info(`Enabled versioning on bucket: ${bucketName}`);
    }
}

/**
 * Create Azure container
 * @param location - Storage location
 */
async function createAzureContainer(location: StorageLocation): Promise<void> {
    const { details } = location;

    // Get credentials (could be in details or details.auth)
    const accountName = resolveEnvValues(details.auth?.accountName || details.accessKey);
    const accountKey = resolveEnvValues(details.auth?.accountKey || details.secretKey);
    const bucketName = resolveEnvValues(details.bucketName);
    const endpoint = resolveEnvValues(details.endpoint);

    if (!accountName || !accountKey || !bucketName || !endpoint) {
        logger.warn(`Missing Azure credentials or config for location ${location.name}, skipping container creation`);
        return;
    }

    try {
        const credential = new BlobStorageSharedKeyCredential(accountName, accountKey);
        const blobServiceClient = new BlobServiceClient(endpoint, credential);

        const containerClient = blobServiceClient.getContainerClient(bucketName);

        const exists = await containerClient.exists();
        if (exists) {
            logger.info(`Azure container ${bucketName} already exists`);
        } else {
            logger.info(`Creating Azure container: ${bucketName}`);
            await containerClient.create();
            logger.info(`Created Azure container: ${bucketName}`);
        }
    } catch (error: any) {
        logger.error(`Error creating Azure container ${bucketName}`, {
            error: error.message,
            location: location.name
        });
        throw error;
    }
}

/**
 * Create Azure queue
 * @param location - Storage location
 */
async function createAzureQueue(location: StorageLocation): Promise<void> {
    const { details } = location;

    const accountName = resolveEnvValues(details.auth?.accountName);
    const accountKey = resolveEnvValues(details.auth?.accountKey);
    const queueName = resolveEnvValues(details.queue?.queueName);
    const queueEndpoint = resolveEnvValues(details.queue?.endpoint);

    if (!accountName || !accountKey || !queueName || !queueEndpoint) {
        logger.warn(`Missing Azure queue credentials or config for location ${location.name}, skipping queue creation`);
        return;
    }

    try {
        const credential = new QueueStorageSharedKeyCredential(accountName, accountKey);
        const queueServiceClient = new QueueServiceClient(queueEndpoint, credential);

        const queueClient = queueServiceClient.getQueueClient(queueName);

        const exists = await queueClient.exists();
        if (exists) {
            logger.info(`Azure queue ${queueName} already exists`);
        } else {
            logger.info(`Creating Azure queue: ${queueName}`);
            await queueClient.create();
            logger.info(`Created Azure queue: ${queueName}`);
        }
    } catch (error: any) {
        logger.error(`Error creating Azure queue ${queueName}`, {
            error: error.message,
            location: location.name
        });
        throw error;
    }
}

/**
 * Add test objects to S3 bucket
 * @param s3Client - S3 client
 * @param bucketName - Bucket name
 */
async function addTestObjects(s3Client: S3Client, bucketName: string): Promise<void> {
    const objectCount = parseInt(process.env.RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE || '5', 10);

    logger.info(`Adding ${objectCount} test objects to bucket: ${bucketName}`);

    try {
        for (let i = 0; i < objectCount; i++) {
            await s3Client.send(new PutObjectCommand({
                Bucket: bucketName,
                Key: `simple-${i}`,
                Body: 'data',
            }));

            await s3Client.send(new PutObjectCommand({
                Bucket: bucketName,
                Key: `zerobyte-${i}`,
                Body: '',
            }));

            await s3Client.send(new PutObjectCommand({
                Bucket: bucketName,
                Key: `mpu-singlepart-${i}`,
                Body: 'mpudata',
            }));
        }
        logger.info(`Added test objects to bucket: ${bucketName}`);
    } catch (error: any) {
        logger.error(`Error adding test objects to bucket ${bucketName}`, { error: error.message });
    }
}

/**
 * Sanitize location for API
 * @param location - Storage location
 * @returns Sanitized location
 */
export function sanitizeLocationForAPI(location: StorageLocation): StorageLocation {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createResources, bootstrapIngestion, ...sanitizedLocation } = location;
    return sanitizedLocation;
}
