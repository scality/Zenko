const { makeGETRequest, getResponseBody } = require('../../utils/request');

function metadataSearchResponseCode(userCredentials, bucketName, cb) {
    return makeGETRequest(`/${bucketName}/?search=${encodeURIComponent('key LIKE "file"')}`, (err, response) => {
        if (err) { return cb(err); }
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

module.exports = {
    metadataSearchResponseCode,
};
