import {
    BlobServiceClient,
    StorageSharedKeyCredential,
    BlobGetPropertiesResponse,
    BlobItem,
} from '@azure/storage-blob';

import {
    QueueServiceClient,
    StorageSharedKeyCredential as StorageQueueSharedKeyCredential,
} from '@azure/storage-queue';

export type AzureCreds = {
    accountName: string;
    accountKey: string;
};

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export default class AzureClient {
    private readonly blobClient: BlobServiceClient;
    private readonly queueClient: QueueServiceClient;

    constructor(creds: AzureCreds) {
        this.blobClient = new BlobServiceClient(
            requireEnv('AZURE_BACKEND_ENDPOINT'),
            new StorageSharedKeyCredential(creds.accountName, creds.accountKey),
        );
        this.queueClient = new QueueServiceClient(
            requireEnv('AZURE_BACKEND_QUEUE_ENDPOINT'),
            new StorageQueueSharedKeyCredential(creds.accountName, creds.accountKey),
        );
    }

    async listBlobs(container: string): Promise<BlobItem[]> {
        const blobList: BlobItem[] = [];
        const iter = await this.blobClient.getContainerClient(container).listBlobsFlat();
        let blobItem = await iter.next();
        while (!blobItem.done) {
            blobList.push(blobItem.value);
            blobItem = await iter.next();
        }
        return blobList;
    }

    async getBlobProperties(container: string, blob: string): Promise<BlobGetPropertiesResponse> {
        const blobClient = this.blobClient.getContainerClient(container).getBlockBlobClient(blob);
        return blobClient.getProperties();
    }

    async blobExists(container: string, blob: string): Promise<boolean> {
        const blobClient = this.blobClient.getContainerClient(container).getBlockBlobClient(blob);
        return blobClient.exists();
    }

    async deleteBlob(container: string, blob: string): Promise<boolean> {
        const res = await this.blobClient
            .getContainerClient(container)
            .getBlockBlobClient(blob)
            .deleteIfExists();
        return res.succeeded;
    }

    async downloadBlob(container: string, blob: string): Promise<Buffer> {
        return this.blobClient.getContainerClient(container).getBlockBlobClient(blob).downloadToBuffer();
    }

    async sendBlobCreatedEventToQueue(queue: string, container: string, blob: string): Promise<void> {
        const message = {
            topic: '/subscriptions/0/resourceGroups/Storage/providers/Microsoft.Storage/storageAccounts/account',
            subject: `/blobServices/default/containers/${container}/blobs/${blob}`,
            eventType: 'Microsoft.Storage.BlobCreated',
            eventTime: '2017-06-26T18:41:00.9584103Z',
            id: '831e1650-001e-001b-66ab-eeb76e069631',
            data: {
                api: 'CopyBlob',
                clientRequestId: '6d79dbfb-0e37-4fc4-981f-442c9ca65760',
                requestId: '831e1650-001e-001b-66ab-eeb76e000000',
                eTag: "'0x8D4BCC2E4835CD0'",
                contentType: 'text/plain',
                contentLength: 524288,
                blobType: 'BlockBlob',
                url: `https://my-storage-account.blob.core.windows.net/${container}/${blob}`,
                sequencer: '00000000000004420000000000028963',
                storageDiagnostics: {
                    batchId: 'b68529f3-68cd-4744-baa4-3c0498ec19f0',
                },
            },
            dataVersion: '',
            metadataVersion: '1',
        };

        const msgString = JSON.stringify(message);
        const msgBuffer = Buffer.from(msgString);

        await this.queueClient.getQueueClient(queue).sendMessage(msgBuffer.toString('base64'));
    }
}
