const azure = require('@azure/storage-blob');

const storageAccount = process.env.AZURE_ACCOUNT_NAME;
const storageAccessKey = process.env.AZURE_SECRET_KEY;
const storageEndpoint = process.env.AZURE_BACKEND_ENDPOINT;

const storageCred = new azure.StorageSharedKeyCredential(storageAccount, storageAccessKey);
const sharedBlobSvc = new azure.BlobServiceClient(storageEndpoint, storageCred);

module.exports = sharedBlobSvc;
