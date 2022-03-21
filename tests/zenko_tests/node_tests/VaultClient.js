const async = require('async');
const fs = require('fs');
const { IAM } = require('aws-sdk');
const vaultclient = require('vaultclient');
const https = require('https');

function _deleteAttachedUserPolicies(iamClient, userName, cb) {
    let truncated = true;

    async.whilst(
        () => truncated,
        done => iamClient.listAttachedUserPolicies(
            { UserName: userName },
            (err, res) => {
                if (err) {
                    return done(err);
                }

                truncated = res.IsTruncated;
                return async.forEach(
                    res.AttachedPolicies,
                    (policy, next) => iamClient.detachUserPolicy({
                        PolicyArn: policy.PolicyArn,
                        UserName: userName,
                    }, next),
                    done,
                );
            },
        ),
        cb,
    );
}

function _deleteAttachedRolePolicies(iamClient, roleName, cb) {
    let truncated = true;

    async.whilst(
        () => truncated,
        done => iamClient.listAttachedRolePolicies(
            { RoleName: roleName },
            (err, res) => {
                if (err) {
                    return done(err);
                }

                truncated = res.IsTruncated;
                return async.forEach(
                    res.AttachedPolicies,
                    (policy, next) => iamClient.detachRolePolicy({
                        PolicyArn: policy.PolicyArn,
                        RoleName: roleName,
                    }, next),
                    done,
                );
            },
        ),
        cb,
    );
}

function _deleteUsers(iamClient, cb) {
    let truncated = true;

    async.whilst(
        () => truncated,
        done => iamClient.listUsers((err, res) => {
            if (err) {
                return done(err);
            }

            truncated = res.IsTruncated;
            return async.forEach(
                res.Users,
                (user, next) => async.series([
                    next => _deleteAttachedUserPolicies(iamClient, user.UserName, next),
                    next => iamClient.deleteUser({ UserName: user.UserName }, next),
                ], next),
                done,
            );
        }),
        cb,
    );
}

function _deleteRoles(iamClient, cb) {
    let truncated = true;

    async.whilst(
        () => truncated,
        done => iamClient.listRoles((err, res) => {
            if (err) {
                return done(err);
            }

            truncated = res.IsTruncated;
            return async.forEach(
                res.Roles,
                (role, next) => async.series([
                    next => _deleteAttachedRolePolicies(iamClient, role.RoleName, next),
                    next => iamClient.deleteRole({ RoleName: role.RoleName }, next),
                ], next),
                done,
            );
        }),
        cb,
    );
}

function _deletePolicies(iamClient, cb) {
    let truncated = true;

    async.whilst(
        () => truncated,
        done => iamClient.listPolicies((err, res) => {
            if (err) {
                return done(err);
            }

            truncated = res.IsTruncated;
            return async.forEach(
                res.Policies,
                (policy, next) => iamClient.deletePolicy({ PolicyArn: policy.Arn }, next),
                done,
            );
        }),
        cb,
    );
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
        const endpoint = process.env.VAULT_ENDPOINT
        || 'http://localhost:8600';
        let ca;
        let httpOptions;
        if (endpoint.startsWith('https://')) {
            ca = fs.readFileSync(
                process.env.VAULT_SSL_CA || '/conf/ca.crt',
                'ascii',
            );
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
                process.env.VAULT_ENDPOINT,
            );
            [host, port] = res.slice(1);
            port = port ? parseInt(port.substring(1), 10) : 80;
            const https = process.env.VAULT_ENDPOINT.startsWith('https://');
            if (https) {
                ca = fs.readFileSync(
                    process.env.VAULT_SSL_CA || '/conf/ca.crt',
                    'ascii',
                );
                cert = fs.readFileSync(
                    process.env.VAULT_SSL_CERT || '/conf/test.crt',
                    'ascii',
                );
                key = fs.readFileSync(
                    process.env.VAULT_SSL_KEY || '/conf/test.key',
                    'ascii',
                );
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
            secretKeyValue: process.env.ADMIN_SECRET_ACCESS_KEY,
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
     * @param {function} cb - callback
     *
     * @return {undefined}
     */
    static deleteVaultAccount(adminClient, iamClient, accountName, cb) {
        async.waterfall([
            next => _deleteUsers(iamClient, next),
            next => _deleteRoles(iamClient, next),
            next => _deletePolicies(iamClient, next),
            next => adminClient.deleteAccount(accountName, next),
        ], cb);
    }
}
module.exports = VaultClient;
