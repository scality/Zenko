import { BlobServiceClient, StorageSharedKeyCredential as BlobCredential } from '@azure/storage-blob';
import { QueueServiceClient, StorageSharedKeyCredential as QueueCredential } from '@azure/storage-queue';
import { Env } from '../../config';

export async function createAzureContainers(env: Env): Promise<void> {
    if (!env.AZURE_ACCOUNT_NAME || !env.AZURE_SECRET_KEY || !env.AZURE_BACKEND_ENDPOINT) {
        console.log('Skipping Azure containers: missing credentials or endpoint');
        return;
    }

    const credential = new BlobCredential(env.AZURE_ACCOUNT_NAME, env.AZURE_SECRET_KEY);
    const blobClient = new BlobServiceClient(env.AZURE_BACKEND_ENDPOINT, credential);

    if (!env.AZURE_CRR_BUCKET_NAME || !env.AZURE_ARCHIVE_BUCKET_NAME || !env.AZURE_ARCHIVE_BUCKET_NAME_2) {
        throw new Error(
            'AZURE_CRR_BUCKET_NAME, AZURE_ARCHIVE_BUCKET_NAME and AZURE_ARCHIVE_BUCKET_NAME_2' +
            ' are required when Azure credentials are provided',
        );
    }

    const containers = [env.AZURE_CRR_BUCKET_NAME, env.AZURE_ARCHIVE_BUCKET_NAME, env.AZURE_ARCHIVE_BUCKET_NAME_2];

    for (const name of containers) {
        console.log(`Creating Azure container: ${name}`);
        try {
            await blobClient.getContainerClient(name).create();
        } catch (err: unknown) {
            if ((err as { statusCode?: number }).statusCode === 409) {
                console.log(`Azure container already exists: ${name}`);
            } else {
                throw err;
            }
        }
    }
}

export async function createAzureQueues(env: Env): Promise<void> {
    if (!env.AZURE_ACCOUNT_NAME || !env.AZURE_SECRET_KEY ||
        !env.AZURE_BACKEND_QUEUE_ENDPOINT || !env.AZURE_ARCHIVE_QUEUE_NAME) {
        console.log('Skipping Azure queues: missing credentials, endpoint, or queue name');
        return;
    }

    const credential = new QueueCredential(env.AZURE_ACCOUNT_NAME, env.AZURE_SECRET_KEY);
    const queueClient = new QueueServiceClient(env.AZURE_BACKEND_QUEUE_ENDPOINT, credential);

    const name = env.AZURE_ARCHIVE_QUEUE_NAME;
    console.log(`Creating Azure queue: ${name}`);
    try {
        await queueClient.createQueue(name);
    } catch (err: unknown) {
        if ((err as { statusCode?: number }).statusCode === 409) {
            console.log(`Azure queue already exists: ${name}`);
        } else {
            throw err;
        }
    }
}
