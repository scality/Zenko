const http = require('http');
const aws4 = require('aws4');
const { getConfig, CLOUDSERVER_HOST } = require('tests_common/configuration');

const defaultOptions = {
    host: CLOUDSERVER_HOST,
    port: 80,
    service: 's3',
};

const getCredentials = () => {
    const { ZenkoAccount } = getConfig();
    return {
        accessKeyId: ZenkoAccount.credentials.accessKeyId,
        secretAccessKey: ZenkoAccount.credentials.secretAccessKey,
        sessionToken: ZenkoAccount.credentials.sessionToken,
    };
};

function getResponseBody(res, cb, isXml = false) {
    res.setEncoding('utf8');
    const resBody = [];
    res.on('data', chunk => resBody.push(chunk));
    res.on('end', () => {
        try {
            const parsedBody = isXml ? resBody.join('') : JSON.parse(resBody.join(''));
            return cb(null, parsedBody);
        } catch (e) {
            return cb(e);
        }
    });
    res.on('error', err => cb(err));
}

/**
 * http request helper method
 * @param {String} path - url path
 * @param {Function} cb - callback(error, response)
 * @param {object} userCredentials - user credentials
 * @return {undefined}
 */
function makeGETRequest(path, cb, userCredentials) {
    let options = {
        ...defaultOptions,
        method: 'GET',
        path,
    };
    options = aws4.sign(options, userCredentials || getCredentials());

    const req = http.request(options, res => cb(null, res));
    req.on('error', err => cb(err));
    req.end();
}

/**
 * http request helper method for POST, PUT, DELETE requests
 * @param {String} path - url path
 * @param {Function} cb - callback(error, response)
 * @param {object} userCredentials - user credentials
 * @param {String} body - request body
 * @param {String} mode - GET or PUT or POST or DELETE. Default to POST.
 * @return {undefined}
 */
function makeUpdateRequest(path, cb, userCredentials, body, mode = 'POST') {
    let options = {
        ...defaultOptions,
        method: mode || 'POST',
        path,
    };
    options = aws4.sign(options, userCredentials || getCredentials());

    const req = http.request(options, res => cb(null, res));
    req.on('error', err => cb(err));
    req.end(body);
}

module.exports = { makeUpdateRequest, makeGETRequest, getResponseBody };
