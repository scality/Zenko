import http from 'http';
import aws4 from 'aws4';
import { makeGETRequest, getResponseBody, makeUpdateRequest } from './request';

const DEFAULT_HOST = process.env.CLOUDSERVER_HOST;
const DEFAULT_PORT = process.env.CLOUDSERVER_PORT || '80';

const testAPIs = [
    {
        API: 'MetadataSearch',
        checkResponse: metadataSearchResponseCode,
    },
    {
        API: 'RestoreObject',
        checkResponse: restoreObjectResponseCode,
    },
    {
        API: 'PutObject',
        checkResponse: putObjectResponseCode,
    },
    {
        API: 'PutObjectAcl',
        checkResponse: putObjectAclResponseCode,
    },
    {
        API: 'GetObject',
        checkResponse: getObjectResponseCode,
    },
    {
        API: 'GetObjectAcl',
        checkResponse: getObjectAclResponseCode,
    },
    {
        API: 'DeleteObject',
        checkResponse: deleteObjectResponseCode,
    },
    {
        API: 'GetBucketVersioning',
        checkResponse: getBucketVersioningResponseCode,
    },
    {
        API: 'GetBucketCors',
        checkResponse: getBucketCorsResponseCode,
    },
    {
        API: 'GetBucketAcl',
        checkResponse: getBucketAclResponseCode,
    },
    {
        API: 'GetBucketObjectLockConfiguration',
        checkResponse: getBucketObjectLockConfResponseCode,
    },
    {
        API: 'ListObjectsV2',
        checkResponse: listObjectsV2ResponseCode,
    },
    {
        API: 'ListObjectVersions',
        checkResponse: listObjectVersionsResponseCode,
    },
    {
        API: 'PutObjectLockConfiguration',
        checkResponse: putObjectLockConfigurationResponseCode,
    },
    {
        API: 'DeleteObjects',
        checkResponse: deleteObjectsResponseCode,
    },
    {
        API: 'GetObjectRetention',
        checkResponse: getBucketObjectRetentionResponseCode,
    },
    {
        API: 'GetObjectLegalHold',
        checkResponse: getObjectLegalHoldResponseCode,
    },
    {
        API: 'PutObjectRetention',
        checkResponse: putObjectRetentionResponseCode,
    },
    {
        API: 'PutObjectLegalHold',
        checkResponse: putObjectLegalHoldTaggingResponseCode,
    },
    {
        API: 'HeadObject',
        checkResponse: headObjectResponseCode,
    },
    {
        API: 'CopyObject',
        checkResponse: copyObjectResponseCode,
    },
    {
        API: 'GetObjectTagging',
        checkResponse: getObjectTaggingResponseCode,
    },
    {
        API: 'PutObjectTagging',
        checkResponse: putObjectTaggingResponseCode,
    },
    {
        API: 'DeleteObjectVersion',
        checkResponse: deleteObjectVersionResponseCode,
    },
    {
        API: 'GetBucketReplication',
        checkResponse: getReplicationConfigurationResponseCode,
    },
    {
        API: 'GetBucketLifecycle',
        checkResponse: getLifecycleConfigurationResponseCode,
    },
    {
        API: 'PutBucketLifecycle',
        checkResponse: putLifecycleConfigurationResponseCode,
    },
    {
        API: 'PutBucketReplication',
        checkResponse: putReplicationConfigurationResponseCode,
    },
    {
        API: 'GetObjectVersion',
        checkResponse: getObjectVersionResponseCode,
    },
    {
        API: 'GetObjectVersionRetention',
        checkResponse: getBucketObjectVersionRetentionResponseCode,
    },
    {
        API: 'PutObjectVersionRetention',
        checkResponse: putObjectVersionRetentionResponseCode,
    },
    {
        API: 'GetObjectVersionLegalHold',
        checkResponse: getObjectVersionLegalHoldResponseCode,
    },
    {
        API: 'PutObjectVersionLegalHold',
        checkResponse: putObjectVersionLegalHoldTaggingResponseCode,
    },
    {
        API: 'GetObjectVersionTagging',
        checkResponse: getObjectVersionTaggingResponseCode,
    },
    {
        API: 'DeleteObjectVersionTagging',
        checkResponse: deleteObjectVersionTaggingResponseCode,
    },
    {
        API: 'PutObjectVersionTagging',
        checkResponse: putObjectVersionTaggingResponseCode,
    },
    {
        API: 'GetObjectVersionAcl',
        checkResponse: getObjectVersionAclResponseCode,
    },
    {
        API: 'PutObjectVersionAcl',
        checkResponse: putObjectVersionAclResponseCode,
    },
    {
        API: 'GetBucketTagging',
        checkResponse: getBucketTaggingResponseCode,
    },
    {
        API: 'PutBucketTagging',
        checkResponse: putBucketTaggingResponseCode,
    },
    {
        API: 'DeleteBucketTagging',
        checkResponse: deleteBucketTaggingResponseCode,
    },
];

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

function restoreObjectResponseCode(userCredentials, bucketName, cb, objectName) {
    return makeApiCallGeneric(
        'POST',
        '<RestoreRequest xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Days>1</Days></RestoreRequest>',
        userCredentials,
        `/${bucketName}/${objectName}?restore`,
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

function putObjectVersionResponseCode(userCredentials, bucketName, cb, fileName) {
    const signOptions = {
        host: DEFAULT_HOST,
        port: DEFAULT_PORT,
        service: 's3',
        method: 'PUT',
        path: `/${bucketName}/${fileName}`,
        headers: {
            'x-scal-s3-version-id': '',
        },
    };

    const body = null;
    const options = aws4.sign(signOptions, userCredentials);

    const req = http.request(options, response => {
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
    });
    req.setHeader('x-scal-s3-version-id', '');
    req.on('error', err => cb(err));
    req.end(body);
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

function putObjectVersionAclResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'PUT',
        '<AccessControlPolicy xmlns="http://s3.amazonaws.com/doc/2006-03-01/">'
        + '</AccessControlPolicy>',
        userCredentials,
        `/${bucketName}/${fileName}?acl&versionId=0`,
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

function getObjectVersionResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/${fileName}?versionId=0`,
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

function getObjectVersionAclResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/${fileName}?acl&versionId=0`,
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

function getBucketObjectVersionRetentionResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/${fileName}?retention&versionId=0`,
        cb,
    );
}

function getBucketTaggingResponseCode(userCredentials, bucketName, cb) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/?tagging`,
        cb,
    );
}

function putBucketTaggingResponseCode(userCredentials, bucketName, cb) {
    return makeApiCallGeneric(
        'PUT',
        '<Tagging xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><TagSet></TagSet></Tagging>',
        userCredentials,
        `/${bucketName}/?tagging`,
        cb,
    );
}

function deleteBucketTaggingResponseCode(userCredentials, bucketName, cb) {
    return makeApiCallGeneric(
        'DELETE',
        null,
        userCredentials,
        `/${bucketName}/?tagging`,
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

function getObjectVersionLegalHoldResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/${fileName}?legal-hold&versionId=0`,
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

function getObjectVersionTaggingResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'GET',
        null,
        userCredentials,
        `/${bucketName}/${fileName}?tagging&versionId=0`,
        cb,
    );
}

function putObjectVersionTaggingResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'PUT',
        null,
        userCredentials,
        `/${bucketName}/${fileName}?tagging&versionId=0`,
        cb,
    );
}

function deleteObjectVersionTaggingResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'DELETE',
        null,
        userCredentials,
        `/${bucketName}/${fileName}?tagging&versionId=0`,
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

function putObjectVersionRetentionResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'PUT',
        '<Retention xmlns="http://s3.amazonaws.com/doc/2006-03-01/"></Retention>',
        userCredentials,
        `/${bucketName}/${fileName}?retention&versionId=0`,
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

function putObjectVersionLegalHoldTaggingResponseCode(userCredentials, bucketName, cb, fileName) {
    return makeApiCallGeneric(
        'PUT',
        '<LegalHold xmlns="http://s3.amazonaws.com/doc/2006-03-01/"></LegalHold>',
        userCredentials,
        `/${bucketName}/${fileName}?legal-hold&versionId=0`,
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

export {
    testAPIs,
};
