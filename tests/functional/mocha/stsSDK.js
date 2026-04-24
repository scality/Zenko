const { STSClient } = require('@aws-sdk/client-sts');
const { VAULT_STS_ENDPOINT } = require('tests_common/configuration');

function getSTSClient(accessKey, secretKey, sessionToken) {
    const config = {
        endpoint: VAULT_STS_ENDPOINT,
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
