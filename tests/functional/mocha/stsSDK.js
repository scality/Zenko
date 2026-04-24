const { STSClient } = require('@aws-sdk/client-sts');

function getSTSClient(accessKey, secretKey, sessionToken) {
    const config = {
        endpoint: process.env.VAULT_STS_ENDPOINT,
        region: 'us-east-1',
        maxAttempts: 1,
        tls: false,
        credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
        },
    };
    if (sessionToken) {
        config.credentials.sessionToken = sessionToken;
    }
    return new STSClient(config);
}

module.exports = {
    getSTSClient,
};
