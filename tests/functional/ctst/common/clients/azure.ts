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

const AZURE_STORAGE_BLOB_URL = process.env.AZURE_BLOB_URL || 'http://127.0.0.1:10000/devstoreaccount1';
const AZURE_STORAGE_QUEUE_URL = process.env.AZURE_QUEUE_URL || 'http://127.0.0.1:10001/devstoreaccount1';

type AzureCreds = {
    accountName: string;
    accountKey: string;
};

const azuriteDefaultCreds = {
    accountName: 'devstoreaccount1',
    accountKey: 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==',
};

/**
 * Helper class for interacting with Azure
 */
export default class AzureHelper {
    public static logger: Werelogs.RequestLogger;

    /**
     * Initialize Azure blob service client
     * Uses default azurite credentials if none specified
     * @param {AzureCreds} creds azure credentials
     * @returns {BlobServiceClient} azure blob service client
     */
    static getBlobClient(creds: AzureCreds = azuriteDefaultCreds): BlobServiceClient {
        return new BlobServiceClient(
            AZURE_STORAGE_BLOB_URL,
            new StorageSharedKeyCredential(creds.accountName, creds.accountKey),
        );
    }

    /**
     * List all blobs in a container
     * Uses default azurite credentials if none specified
     * @param {string} container target container
     * @param {AzureCreds} creds azure credentials
     * @returns {Promise<BlobItem[]>} list of blobs with their metadata
     */
    static async listBlobs(container: string, creds: AzureCreds = azuriteDefaultCreds): Promise<BlobItem[]> {
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
     * Uses default azurite credentials if none specified
     * @param {string} container target container
     * @param {string} blob target blob
     * @param {AzureCreds} creds azure credentials
     * @returns {Promise<BlobGetPropertiesResponse>} blob metadata
     */
    static async getBlobProperties(
        container: string,
        blob: string,
        creds: AzureCreds = azuriteDefaultCreds,
    ): Promise<BlobGetPropertiesResponse> {
        const blobClient = this.getBlobClient(creds).getContainerClient(container).getBlockBlobClient(blob);

        return blobClient.getProperties();
    }

    /**
     * Checks if a blob exists
     * Uses default azurite credentials if none specified
     * @param {string} container target container
     * @param {string} blob target blob
     * @param {AzureCreds} creds azure credentials
     * @returns {Promise<boolean>} true if blob exists
     */
    static async blobExists(
        container: string,
        blob: string,
        creds: AzureCreds = azuriteDefaultCreds,
    ): Promise<boolean> {
        const blobClient = this.getBlobClient(creds).getContainerClient(container).getBlockBlobClient(blob);

        return blobClient.exists();
    }

    /**
     * Deletes a blob
     * Uses default azurite credentials if none specified
     * @param {string} container target container
     * @param {string} blob target blob
     * @param {AzureCreds} creds azure credentials
     * @returns {Promise<boolean>} true if blob was deleted
     */
    static async deleteBlob(
        container: string,
        blob: string,
        creds: AzureCreds = azuriteDefaultCreds,
    ): Promise<boolean> {
        const res = await this.getBlobClient(creds)
            .getContainerClient(container)
            .getBlockBlobClient(blob)
            .deleteIfExists();

        return res.succeeded;
    }

    /**
     * Downloads a blob into a buffer
     * Uses default azurite credentials if none specified
     * @param {string} container target container
     * @param {string} blob target blob
     * @param {AzureCreds} creds azure credentials
     * @returns {Promise<Buffer>} blob data
     */
    static async downloadBlob(
        container: string,
        blob: string,
        creds: AzureCreds = azuriteDefaultCreds,
    ): Promise<Buffer> {
        return this.getBlobClient(creds).getContainerClient(container).getBlockBlobClient(blob).downloadToBuffer();
    }

    /**
     * Initialize Azure queue service client
     * Uses default azurite credentials if none specified
     * @param {AzureCreds} creds azure credentials
     * @returns {QueueServiceClient} azure queue service client
     */
    static getQueueClient(creds: AzureCreds = azuriteDefaultCreds): QueueServiceClient {
        return new QueueServiceClient(
            AZURE_STORAGE_QUEUE_URL,
            new StorageQueueSharedKeyCredential(creds.accountName, creds.accountKey),
        );
    }

    /**
     * Sends a Microsoft.Storage.BlobCreated event into a storage queue
     * Schema of message can be found in:
     * https://learn.microsoft.com/en-us/azure/event-grid/event-schema-blob-storage?tabs=event-grid-event-schema
     * #microsoftstorageblobcreated-event
     * Uses default azurite credentials if none specified
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
        creds: AzureCreds = azuriteDefaultCreds,
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
