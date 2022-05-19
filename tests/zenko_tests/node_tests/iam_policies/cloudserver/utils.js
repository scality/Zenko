const { makeGETRequest, getResponseBody, makePOSTRequest } = require('../../utils/request');

// eslint-disable-next-line default-param-last
function makeApiCallGeneric(mode = 'GET', body, userCredentials, query, cb) {
    const fn = mode === 'GET' ? makeGETRequest : makePOSTRequest;
    return fn(query, (err, response) => {
        if (err) {
            return cb(err);
        }
        const { statusCode } = response;
        return getResponseBody(response, (err, res) => {
            if (err) {
                return cb(err);
            }
            const r = /<Code>(.*)<\/Code>/;
            const code = res.match(r);
            if (code !== null) {
                return cb(null, { statusCode, code: code[1] });
            }
            return cb(null, { statusCode, code });
        }, true);
    }, userCredentials, body);
}

function metadataSearchResponseCode(userCredentials, bucketName, cb) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/?search=${encodeURIComponent('key LIKE "file"')}`,
        cb,
    );
}

function restoreObjectResponseCode(userCredentials, bucketName, cb, objectName) {
    return makeApiCallGeneric(
        'POST',
        '<RestoreRequest xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Days>1</Days></RestoreRequest>',
        userCredentials,
        `/${bucketName}/${objectName}?restore`,
        cb,
    );
}

function createPolicy(action, isAllow = true, resource = '*') {
    return JSON.stringify({
        Version: '2012-10-17',
        Statement: [
            {
                Sid: 'Stmt1644586763301',
                Action: [
                    action,
                ],
                Effect: (isAllow ? 'Allow' : 'Deny'),
                Resource: resource,
            },
        ],
    });
}

module.exports = {
    metadataSearchResponseCode,
    restoreObjectResponseCode,
    createPolicy,
};
