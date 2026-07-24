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

import Werelogs from 'werelogs';

type AzureCreds = {
    accountName: string;
    accountKey: string;
};

/**
 * Helper class for interacting with Azure
 */
export default class AzureHelper {
    public static logger: Werelogs.RequestLogger;

    /**
     * Initialize Azure blob service client
     * @param {AzureCreds} creds azure credentials
     * @returns {BlobServiceClient} azure blob service client
     */
    static getBlobClient(creds: AzureCreds): BlobServiceClient {
        return new BlobServiceClient(
            process.env.AZURE_BACKEND_ENDPOINT!,
            new StorageSharedKeyCredential(creds.accountName, creds.accountKey),
        );
    }

    /**
     * List all blobs in a container
     * @param {string} container target container
     * @param {AzureCreds} creds azure credentials
     * @returns {Promise<BlobItem[]>} list of blobs with their metadata
     */
    static async listBlobs(container: string, creds: AzureCreds): Promise<BlobItem[]> {
        const client = this.getBlobClient(creds);

        const blobList: BlobItem[] = [];

        const iter = await client.getContainerClient(container).listBlobsFlat();

        let blobItem = await iter.next();
        while (!blobItem.done) {
            blobList.push(blobItem.value);
            blobItem = await iter.next();
        }

        return blobList;
    }

    /**
     * Gets blob metadata
     * @param {string} container target container
     * @param {string} blob target blob
     * @param {AzureCreds} creds azure credentials
     * @returns {Promise<BlobGetPropertiesResponse>} blob metadata
     */
    static async getBlobProperties(
        container: string,
        blob: string,
        creds: AzureCreds,
    ): Promise<BlobGetPropertiesResponse> {
        const blobClient = this.getBlobClient(creds).getContainerClient(container).getBlockBlobClient(blob);

        return blobClient.getProperties();
    }

    /**
     * Checks if a blob exists
     * @param {string} container target container
     * @param {string} blob target blob
     * @param {AzureCreds} creds azure credentials
     * @returns {Promise<boolean>} true if blob exists
     */
    static async blobExists(
        container: string,
        blob: string,
        creds: AzureCreds,
    ): Promise<boolean> {
        const blobClient = this.getBlobClient(creds).getContainerClient(container).getBlockBlobClient(blob);

        return blobClient.exists();
    }

    /**
     * Deletes a blob
     * @param {string} container target container
     * @param {string} blob target blob
     * @param {AzureCreds} creds azure credentials
     * @returns {Promise<boolean>} true if blob was deleted
     */
    static async deleteBlob(
        container: string,
        blob: string,
        creds: AzureCreds,
    ): Promise<boolean> {
        const res = await this.getBlobClient(creds)
            .getContainerClient(container)
            .getBlockBlobClient(blob)
            .deleteIfExists();

        return res.succeeded;
    }

    /**
     * Downloads a blob into a buffer
     * @param {string} container target container
     * @param {string} blob target blob
     * @param {AzureCreds} creds azure credentials
     * @returns {Promise<Buffer>} blob data
     */
    static async downloadBlob(
        container: string,
        blob: string,
        creds: AzureCreds,
    ): Promise<Buffer> {
        return this.getBlobClient(creds).getContainerClient(container).getBlockBlobClient(blob).downloadToBuffer();
    }

    /**
     * Initialize Azure queue service client
     * @param {AzureCreds} creds azure credentials
     * @returns {QueueServiceClient} azure queue service client
     */
    static getQueueClient(creds: AzureCreds): QueueServiceClient {
        return new QueueServiceClient(
            process.env.AZURE_BACKEND_QUEUE_ENDPOINT!,
            new StorageQueueSharedKeyCredential(creds.accountName, creds.accountKey),
        );
    }

    /**
     * Sends a Microsoft.Storage.BlobCreated event into a storage queue
     * Schema of message can be found in:
     * https://learn.microsoft.com/en-us/azure/event-grid/event-schema-blob-storage?tabs=event-grid-event-schema
     * #microsoftstorageblobcreated-event
     * @param {string} queue target storage queue
     * @param {string} container target container
     * @param {string} blob target blob
     * @param {AzureCreds} creds azure credentials
     * @returns {Promise<boolean>} true if message was sent
     */
    static async sendBlobCreatedEventToQueue(
        queue: string,
        container: string,
        blob: string,
        creds: AzureCreds,
    ): Promise<boolean> {
        const message = {
            topic: '/subscriptions/0/resourceGroups/Storage/providers/Microsoft.Storage/storageAccounts/accont',
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

        try {
            await this.getQueueClient(creds).getQueueClient(queue).sendMessage(msgBuffer.toString('base64'));
            return true;
        } catch (err) {
            if (err instanceof Error) {
                this.logger?.debug('Failed to send message to queue.', {
                    err,
                });
            }
            return false;
        }
    }
}
