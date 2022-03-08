const azure = require('azure-storage');

const storageAccount = process.env.AZURE_ACCOUNT_NAME;
const storageAccessKey = process.env.AZURE_SECRET_KEY;
const storageEndpoint = process.env.AZURE_BACKEND_ENDPOINT;

const sharedBlobSvc = azure.createBlobService(storageAccount, storageAccessKey, storageEndpoint);

module.exports = sharedBlobSvc;
