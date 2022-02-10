const http = require('http');
const aws4 = require('aws4');

const DEFAULT_HOST = process.env.CLOUDSERVER_HOST;
const DEFAULT_PORT = '80';

const accessKeyId = process.env.ZENKO_ACCESS_KEY;
const secretAccessKey = process.env.ZENKO_SECRET_KEY;
const sessionToken = process.env.ZENKO_SESSION_TOKEN;

const defaultOptions = {
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    service: 's3',
};
const credentials = { accessKeyId, secretAccessKey, sessionToken };

function getResponseBody(res, cb) {
    res.setEncoding('utf8');
    const resBody = [];
    res.on('data', chunk => resBody.push(chunk));
    res.on('end', () => {
        try {
            const parsedBody = JSON.parse(resBody.join(''));
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
 * @return {undefined}
 */
function makeGETRequest(path, cb, userCredentials) {
    let options = Object.assign({}, defaultOptions, {
        method: 'GET',
        path,
    });
    if (userCredentials) {
        options = aws4.sign(options, userCredentials);
    } else {
        options = aws4.sign(options, credentials);
    }

    const req = http.request(options, res => cb(null, res));
    req.on('error', err => cb(err));
    req.end();
}

/**
 * http request helper method
 * @param {String} path - url path
 * @param {String} body - request body
 * @param {Function} cb - callback(error, response)
 * @return {undefined}
 */
function makePOSTRequest(path, body, cb, userCredentials) {
    let options = Object.assign({}, defaultOptions, {
        method: 'POST',
        path,
    });
    if (userCredentials) {
        options = aws4.sign(options, userCredentials);
    } else {
        options = aws4.sign(options, credentials);
    }

    const req = http.request(options, res => cb(null, res));
    req.on('error', err => cb(err));
    req.end(body);
}

module.exports = { makePOSTRequest, makeGETRequest, getResponseBody };
