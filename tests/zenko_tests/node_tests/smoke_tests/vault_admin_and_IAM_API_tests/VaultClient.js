const fs = require('fs');
const { IAM } = require('aws-sdk');
const vaultclient = require('vaultclient');

class VaultClient {

/**
 * Returns an AWS IAM client
 *
 * @param {string} accessKey - access key
 * @param {string} secretKey - secret key
 * @param {string} sessionToken - session token
 * @returns {object} - returns an IAM client
 */
 static getIamClient(accessKey, secretKey, sessionToken) {
    const endpoint = process.env.VAULT_ENDPOINT ||
        'http://localhost:8600';
    let ca;
    let httpOptions;
    if (endpoint.startsWith('https://')) {
        ca = fs.readFileSync(process.env.VAULT_SSL_CA || '/conf/ca.crt',
            'ascii');
        httpOptions = {
            agent: new https.Agent({
                ca: [ca],
            }),
        };
    }
    const info = {
        endpoint,
        httpOptions,
        sslEnabled: httpOptions !== undefined,
        region: 'us-east-1',
        apiVersion: '2010-05-08',
        signatureVersion: 'v4',
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        maxRetries: 0,
    };
    if (sessionToken) {
        info.sessionToken = sessionToken;
    }
    return new IAM(info);
}

    /**
     * Get endpoint information
     *
     * @return {object} Vault endpoint information
     */
    static getEndpointInformation() {
        let host = '127.0.0.1';
        let port = 8600;
        let ca;
        let cert;
        let key;
        if (process.env.VAULT_ENDPOINT) {
            const res = /^https?:\/\/([^:]*)(:[0-9]+)?\/?$/.exec(
                process.env.VAULT_ENDPOINT);
            host = res[1];
            port = res[2] ? parseInt(res[2].substring(1), 10) : 80;
            const https = process.env.VAULT_ENDPOINT.startsWith('https://');
            if (https) {
                ca = fs.readFileSync(process.env.VAULT_SSL_CA || '/conf/ca.crt',
                    'ascii');
                cert = fs.readFileSync(process.env.VAULT_SSL_CERT || '/conf/test.crt',
                    'ascii');
                key = fs.readFileSync(process.env.VAULT_SSL_KEY || '/conf/test.key',
                    'ascii');
            }
        }
        return {
            host,
            port,
            ca,
            cert,
            key,
        };
    }

    /**
     * Get an admin client
     *
     * @return {vaultclient.Client} Vault client for admin calls
     */
    static getAdminClient() {
        const adminCredentials = {
            accessKey: process.env.ADMIN_ACCESS_KEY_ID,
            secretKeyValue: process.env.ADMIN_SECRET_ACCESS_KEY
        };
        const info = this.getEndpointInformation();
        const adminClient = new vaultclient.Client(info.host, info.port,
            info.ca !== undefined, undefined, undefined, info.ca, false,
            adminCredentials.accessKey, adminCredentials.secretKeyValue);
        return adminClient;
    }

    
}
module.exports = VaultClient;
