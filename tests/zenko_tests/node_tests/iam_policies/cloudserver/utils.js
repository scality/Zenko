const { makeGETRequest, getResponseBody, makeUpdateRequest } = require('../../utils/request');

// eslint-disable-next-line default-param-last
function makeApiCallGeneric(mode = 'GET', body, userCredentials, query, cb) {
    const fn = mode === 'GET' ? makeGETRequest : makeUpdateRequest;
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
    }, userCredentials, body, mode);
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

function putObjectResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'PUT',
        null,
        userCredentials,
        `/${bucketName}/${fileName}`,
        cb,
    );
}

function putObjectAclResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'PUT',
        '<AccessControlPolicy xmlns="http://s3.amazonaws.com/doc/2006-03-01/">'
        + '</AccessControlPolicy>',
        userCredentials,
        `/${bucketName}/${fileName}?acl`,
        cb,
    );
}

function getObjectResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/${fileName}`,
        cb,
    );
}

function getObjectAclResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/${fileName}?acl`,
        cb,
    );
}

function deleteObjectResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'DELETE',
        null,
        userCredentials,
        `/${bucketName}/${fileName}`,
        cb,
    );
}

function deleteObjectVersionResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'DELETE',
        null,
        userCredentials,
        `/${bucketName}/${fileName}?versionId=0`,
        cb,
    );
}

function getBucketVersioningResponseCode(userCredentials, bucketName, cb) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/?versioning`,
        cb,
    );
}

function getBucketCorsResponseCode(userCredentials, bucketName, cb) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/?cors`,
        cb,
    );
}

function getBucketAclResponseCode(userCredentials, bucketName, cb) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/?acl`,
        cb,
    );
}

function getBucketObjectLockConfResponseCode(userCredentials, bucketName, cb) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/?object-lock`,
        cb,
    );
}

function getBucketObjectRetentionResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/${fileName}?retention`,
        cb,
    );
}

function getObjectLegalHoldResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/${fileName}?legal-hold`,
        cb,
    );
}

function getObjectTaggingResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/${fileName}?tagging`,
        cb,
    );
}

function listObjectsV2ResponseCode(userCredentials, bucketName, cb) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/?list-type=2`,
        cb,
    );
}

function listObjectVersionsResponseCode(userCredentials, bucketName, cb) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `${bucketName}/?versions`,
        cb,
    );
}

function copyObjectResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'PUT',
        null,
        userCredentials,
        `/${bucketName}/${fileName}`,
        cb,
    );
}

function putObjectRetentionResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'PUT',
        '<Retention xmlns="http://s3.amazonaws.com/doc/2006-03-01/"></Retention>',
        userCredentials,
        `/${bucketName}/${fileName}?retention`,
        cb,
    );
}

function putObjectTaggingResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'PUT',
        '<Tagging xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><TagSet></TagSet></Tagging>',
        userCredentials,
        `/${bucketName}/${fileName}?tagging`,
        cb,
    );
}

function putObjectLegalHoldTaggingResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'PUT',
        '<LegalHold xmlns="http://s3.amazonaws.com/doc/2006-03-01/"></LegalHold>',
        userCredentials,
        `/${bucketName}/${fileName}?legal-hold`,
        cb,
    );
}

function putObjectLockConfigurationResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'PUT',
        '<ObjectLockConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"></ObjectLockConfiguration>',
        userCredentials,
        `/${bucketName}/${fileName}?object-lock`,
        cb,
    );
}

function headObjectResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'HEAD',
        null,
        userCredentials,
        `/${bucketName}/${fileName}`,
        cb,
    );
}

function deleteObjectsResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'DELETE',
        null,
        userCredentials,
        `/${bucketName}/${fileName}`,
        cb,
    );
}

function getReplicationConfigurationResponseCode(userCredentials, bucketName, cb) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/?replication`,
        cb,
    );
}

function getLifecycleConfigurationResponseCode(userCredentials, bucketName, cb) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/?lifecycle`,
        cb,
    );
}


function putLifecycleConfigurationResponseCode(userCredentials, bucketName, cb) {
    return makeApiCallGeneric(
        'PUT',
        '<LifecycleConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"></LifecycleConfiguration>',
        userCredentials,
        `/${bucketName}/?lifecycle`,
        cb,
    );
}

function putReplicationConfigurationResponseCode(userCredentials, bucketName, cb) {
    return makeApiCallGeneric(
        'PUT',
        '<ReplicationConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"></ReplicationConfiguration>',
        userCredentials,
        `/${bucketName}/?replication`,
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
    putObjectResponseCode,
    putObjectAclResponseCode,
    getObjectResponseCode,
    getObjectAclResponseCode,
    deleteObjectResponseCode,
    deleteObjectVersionResponseCode,
    getBucketVersioningResponseCode,
    getBucketCorsResponseCode,
    getBucketAclResponseCode,
    getBucketObjectLockConfResponseCode,
    getBucketObjectRetentionResponseCode,
    getReplicationConfigurationResponseCode,
    getLifecycleConfigurationResponseCode,
    putLifecycleConfigurationResponseCode,
    putReplicationConfigurationResponseCode,
    getObjectLegalHoldResponseCode,
    getObjectTaggingResponseCode,
    listObjectsV2ResponseCode,
    listObjectVersionsResponseCode,
    copyObjectResponseCode,
    putObjectRetentionResponseCode,
    putObjectTaggingResponseCode,
    putObjectLegalHoldTaggingResponseCode,
    putObjectLockConfigurationResponseCode,
    deleteObjectsResponseCode,
    headObjectResponseCode,
    createPolicy,
};
