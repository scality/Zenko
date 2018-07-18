const http = require('http');

const DEFAULT_HOST = 'zenko.local';
const DEFAULT_PORT = '80';

const defaultOptions = {
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
};

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
function makeGETRequest(path, cb) {
    const options = Object.assign({}, defaultOptions, {
        method: 'GET',
        path,
    });
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
function makePOSTRequest(path, body, cb) {
    const options = Object.assign({}, defaultOptions, {
        method: 'POST',
        path,
    });
    const req = http.request(options, res => cb(null, res));
    req.on('error', err => cb(err));
    req.end(body);
}

module.exports = { makePOSTRequest, makeGETRequest, getResponseBody };
