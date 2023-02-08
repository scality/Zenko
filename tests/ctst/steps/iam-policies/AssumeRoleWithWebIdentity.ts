import { Then, When } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
const { errors } = require('arsenal');
const {
    metadataSearchResponseCode,
    restoreObjectResponseCode,
    putObjectResponseCode,
    putObjectAclResponseCode,
    putObjectVersionAclResponseCode,
    getObjectResponseCode,
    getObjectVersionResponseCode,
    getObjectAclResponseCode,
    getObjectVersionAclResponseCode,
    deleteObjectResponseCode,
    deleteObjectVersionResponseCode,
    getBucketVersioningResponseCode,
    getBucketCorsResponseCode,
    getBucketAclResponseCode,
    getBucketObjectLockConfResponseCode,
    getBucketObjectRetentionResponseCode,
    getBucketObjectVersionRetentionResponseCode,
    getReplicationConfigurationResponseCode,
    getLifecycleConfigurationResponseCode,
    putLifecycleConfigurationResponseCode,
    putReplicationConfigurationResponseCode,
    getObjectLegalHoldResponseCode,
    getObjectVersionLegalHoldResponseCode,
    getObjectTaggingResponseCode,
    getObjectVersionTaggingResponseCode,
    listObjectsV2ResponseCode,
    listObjectVersionsResponseCode,
    copyObjectResponseCode,
    putObjectRetentionResponseCode,
    putObjectVersionRetentionResponseCode,
    putObjectTaggingResponseCode,
    putObjectLegalHoldTaggingResponseCode,
    putObjectVersionLegalHoldTaggingResponseCode,
    deleteObjectVersionTaggingResponseCode,
    putObjectVersionTaggingResponseCode,
    putObjectLockConfigurationResponseCode,
    deleteObjectsResponseCode,
    headObjectResponseCode,
    getBucketTaggingResponseCode,
    putBucketTaggingResponseCode,
    deleteBucketTaggingResponseCode,
} = require('../../common/utils.js');

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

When('a {string} tries to perform {string}', function (type : string, action : string) {
    testAPIs.find(api => api.API === action)?.checkResponse(this.parameters.AssumedSession,
        this.saved.bucketName, (err : any, res : any) => {
        if (err) {
            assert.ifError(err);
            return (err);
        }
        this.result = res;
        return (res);
    }, 'x'.repeat(10));
});

Then('they should be able to execute the API', function () {
    assert.notStrictEqual(this.result.code, errors.AccessDenied.message);
});