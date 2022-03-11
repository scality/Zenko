const querystring = require('querystring');
const http = require('http');
const assert = require('assert');

const USER_1_PASSWORD = process.env.KEYCLOAK_TEST_PASSWORD || '123';
const HOST_1_URL = process.env.KEYCLOAK_TEST_HOST || 'http://keycloak.zenko.local';
const HOST_1_PORT = parseInt(process.env.KEYCLOAK_TEST_PORT, 10) || 80;
const REALM_NAME = process.env.KEYCLOAK_TEST_REALM_NAME || 'zenko';
const KEYCLOAK_PATH = `/auth/realms/${REALM_NAME}/protocol/openid-connect/token`;
const CLIENT_ID = process.env.KEYCLOAK_TEST_CLIENT_ID || 'zenko-ui';
const GRANT_TYPE = process.env.KEYCLOAK_TEST_GRANT_TYPE || 'password';


/**
 * HTTP client to request JWT token given the username and password.
 *
 * @param {string} username - username of user requesting token
 * @param {string} password - password of user requesting token
 * @param {string} host - host URL of keycloak service
 * @param {number} port - port of keycloak service
 * @param {string} path - path of keycloak service authentication API
 * @param {string} clientId - id of the client of the user
 * @param {string} grandType - grant of the user
 * @param {function} callback - callback function called with error or result
 * @returns {undefined} undefined
 */
function getWebIdentityToken(
    username,
    password,
    host,
    port,
    path,
    clientId,
    grandType,
    callback,
) {
    // In Zenko, we are using an endpoint as the `KEYCLOAK_TEST_HOST` env variable
    // So we should remove any existing http of https prefix in HOST_1_URL.
    host = host.replace('https://', '').replace('http://', '');
    const userData = querystring.stringify({
        username,
        password,
        client_id: clientId,
        grant_type: grandType,
    });
    const options = {
        host,
        port,
        method: 'POST',
        path,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': userData.length,
        },
        rejectUnauthorized: false,
    };
    const req = http.request(options, response => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
            response.resume();
            return callback(new Error(`Status Code: ${response.statusCode}`));
        }
        const data = [];
        return response
            .on('data', chunk => data.push(chunk))
            .on('end', () => {
                let accessToken = null;
                let error = null;
                try {
                    accessToken = (JSON.parse(Buffer.concat(data))).access_token;
                } catch (err) {
                    error = err;
                }
                return callback(error, accessToken);
            })
            .on('error', err => callback(err));
    });
    req.on('error', err => callback(err));
    req.write(userData);
    req.end();
}

function getTokenForIdentity(identity, callback) {
    getWebIdentityToken(
        identity,
        USER_1_PASSWORD,
        HOST_1_URL,
        HOST_1_PORT,
        KEYCLOAK_PATH,
        CLIENT_ID,
        GRANT_TYPE,
        (err, token) => {
            assert(err === null);
            callback(err, token);
        },
    );
}

module.exports = {
    getTokenForIdentity,
};
