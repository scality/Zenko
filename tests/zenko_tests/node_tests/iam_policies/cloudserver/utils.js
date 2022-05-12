const { makeGETRequest, getResponseBody, makePOSTRequest } = require('../../utils/request');

function makeApiCallGeneric(mode = 'GET', body, userCredentials, query, cb) {
    const fn = mode === 'GET' ? makeGETRequest : makePOSTRequest;
    if (mode === 'GET') {
        return makeGETRequest(query, (err, response) => {
            if (err) {
                return cb(err);
            }
            const { statusCode } = response;
            return getResponseBody(response, (err, res) => {
                const r = /<Message>(.*)<\/Message>/;
                const message = res.match(r);
                if (message !== null) {
                    return cb(null, { statusCode, message: message[1] });
                }
                return cb(null, { statusCode, message });
            }, true);
        }, userCredentials);
    }
    return fn(query, body, (err, response) => {
        if (err) {
            return cb(err);
        }
        const { statusCode } = response;
        return getResponseBody(response, (err, res) => {
            const r = /<Message>(.*)<\/Message>/;
            const message = res.match(r);
            if (message !== null) {
                return cb(null, { statusCode, message: message[1] });
            }
            return cb(null, { statusCode, message });
        }, true);
    }, userCredentials);
}

function metadataSearchResponseCode(userCredentials, bucketName, cb) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/?search=${encodeURIComponent('key LIKE "file"')}`,
        cb);
}

function restoreObjectResponseCode(userCredentials, bucketName, cb) {
    return makeApiCallGeneric(
        'POST',
        {
            RestoreDay: 1,
            Days: 1,
        },
        userCredentials,
        `/${bucketName}/restore`,
        cb);
}

module.exports = {
    metadataSearchResponseCode,
    restoreObjectResponseCode,
};
