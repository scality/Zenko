const azure = require('azure-storage');

const storageAccount = process.env.AZURE_BACKBEAT_ACCOUNT_NAME;
const storageAccessKey = process.env.AZURE_BACKBEAT_ACCESS_KEY;
const storageEndpoint = process.env.AZURE_BACKBEAT_ENDPOINT;

const sharedBlobSvc =
    azure.createBlobService(storageAccount, storageAccessKey, storageEndpoint);

module.exports = sharedBlobSvc;
