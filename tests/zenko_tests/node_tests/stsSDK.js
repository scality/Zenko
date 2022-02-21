const { STS } = require('aws-sdk');

function getSTSClient(accessKey, secretKey, sessionToken) {
    const config = {
        endpoint: process.env.VAULT_STS_ENDPOINT,
        sslEnabled: false,
        region: 'us-east-1',
        apiVersion: '2011-06-15',
        signatureVersion: 'v4',
        signatureCache: false,
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        maxRetries: 0,
    };
    if (sessionToken) {
        config.sessionToken = sessionToken;
    }
    return new STS(config);
}

module.exports = {
    getSTSClient,
};
