const fs = require('fs');
const { config, VAULT_ENDPOINT } = require('tests_common/configuration');
const {
    IAMClient,
    DetachUserPolicyCommand,
    DetachRolePolicyCommand,
    DeleteUserCommand,
    DeleteRoleCommand,
    DeletePolicyCommand,
    paginateListAttachedUserPolicies,
    paginateListAttachedRolePolicies,
    paginateListUsers,
    paginateListRoles,
    paginateListPolicies,
} = require('@aws-sdk/client-iam');
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const vaultclient = require('vaultclient');
const https = require('https');

async function _deleteAttachedUserPolicies(iamClient, userName) {
    const paginator = paginateListAttachedUserPolicies({ client: iamClient }, { UserName: userName });
    // eslint-disable-next-line no-restricted-syntax
    for await (const page of paginator) {
        if (page.AttachedPolicies && page.AttachedPolicies.length > 0) {
            await Promise.all(page.AttachedPolicies.map(policy => iamClient.send(new DetachUserPolicyCommand({
                PolicyArn: policy.PolicyArn,
                UserName: userName,
            }))));
        }
    }
}

async function _deleteAttachedRolePolicies(iamClient, roleName) {
    const paginator = paginateListAttachedRolePolicies({ client: iamClient }, { RoleName: roleName });
    // eslint-disable-next-line no-restricted-syntax
    for await (const page of paginator) {
        if (page.AttachedPolicies && page.AttachedPolicies.length > 0) {
            await Promise.all(page.AttachedPolicies.map(policy => iamClient.send(new DetachRolePolicyCommand({
                PolicyArn: policy.PolicyArn,
                RoleName: roleName,
            }))));
        }
    }
}

async function _deleteUsers(iamClient) {
    const paginator = paginateListUsers({ client: iamClient }, {});
    // eslint-disable-next-line no-restricted-syntax
    for await (const page of paginator) {
        if (page.Users && page.Users.length > 0) {
            await Promise.all(page.Users.map(async user => {
                await _deleteAttachedUserPolicies(iamClient, user.UserName);
                await iamClient.send(new DeleteUserCommand({ UserName: user.UserName }));
            }));
        }
    }
}

async function _deleteRoles(iamClient) {
    const paginator = paginateListRoles({ client: iamClient }, {});
    // eslint-disable-next-line no-restricted-syntax
    for await (const page of paginator) {
        if (page.Roles && page.Roles.length > 0) {
            await Promise.all(page.Roles.map(async role => {
                await _deleteAttachedRolePolicies(iamClient, role.RoleName);
                await iamClient.send(new DeleteRoleCommand({ RoleName: role.RoleName }));
            }));
        }
    }
}

async function _deletePolicies(iamClient) {
    const paginator = paginateListPolicies({ client: iamClient }, { Scope: 'Local' });
    // eslint-disable-next-line no-restricted-syntax
    for await (const page of paginator) {
        if (page.Policies && page.Policies.length > 0) {
            await Promise.all(page.Policies.map(policy => iamClient.send(
                new DeletePolicyCommand({ PolicyArn: policy.Arn }),
            )));
        }
    }
}

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
        const endpoint = VAULT_ENDPOINT;
        const info = {
            endpoint,
            region: 'us-east-1',
            maxAttempts: 1,
            tls: false,
            credentials: {
                accessKeyId: accessKey,
                secretAccessKey: secretKey,
            },
        };

        if (endpoint.startsWith('https://')) {
            const ca = fs.readFileSync(
                process.env.VAULT_SSL_CA || '/conf/ca.crt',
                'ascii',
            );
            info.requestHandler = new NodeHttpHandler({
                httpsAgent: new https.Agent({
                    ca: [ca],
                }),
            });
            info.tls = true;
        }

        if (sessionToken) {
            info.credentials.sessionToken = sessionToken;
        }
        return new IAMClient(info);
    }

    /**
     * Get endpoint information
     *
     * @returns {object} Vault endpoint information
     */
    static getEndpointInformation() {
        const res = /^https?:\/\/([^:]*)(:[0-9]+)?\/?$/.exec(VAULT_ENDPOINT);
        let [host, port] = res.slice(1);
        port = port ? parseInt(port.substring(1), 10) : 80;
        let ca;
        let cert;
        let key;
        if (VAULT_ENDPOINT.startsWith('https://')) {
            ca = fs.readFileSync(process.env.VAULT_SSL_CA || '/conf/ca.crt', 'ascii');
            cert = fs.readFileSync(process.env.VAULT_SSL_CERT || '/conf/test.crt', 'ascii');
            key = fs.readFileSync(process.env.VAULT_SSL_KEY || '/conf/test.key', 'ascii');
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
     * @returns {vaultclient.Client} Vault client for admin calls
     */
    static getAdminClient() {
        const adminCredentials = {
            accessKey: config.AdminCredentials.accessKey,
            secretKeyValue: config.AdminCredentials.secretKey,
        };
        const info = this.getEndpointInformation();
        return new vaultclient.Client(
            info.host,
            info.port,
            info.ca !== undefined,
            undefined,
            undefined,
            info.ca,
            false,
            adminCredentials.accessKey,
            adminCredentials.secretKeyValue,
        );
    }

    /**
     * Delete all account subresources and account
     * @param {vaultclient.Client} adminClient - Vault client for admin calls
     * @param {object} iamClient - IAM client
     * @param {string} accountName - account name
     *
     * @returns {Promise<void>} Promise that resolves when account deletion is complete
     */
    static async deleteVaultAccount(adminClient, iamClient, accountName) {
        await _deleteUsers(iamClient);
        await _deleteRoles(iamClient);
        await _deletePolicies(iamClient);
        await new Promise((resolve, reject) => {
            adminClient.deleteAccount(accountName, err => (err ? reject(err) : resolve()));
        });
    }
}
module.exports = VaultClient;
