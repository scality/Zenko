"use strict";
exports.__esModule = true;
var cucumber_1 = require("@cucumber/cucumber");
var assert_1 = require("assert");
var errors = require('arsenal').errors;
var _a = require('../../common/utils.js'), metadataSearchResponseCode = _a.metadataSearchResponseCode, restoreObjectResponseCode = _a.restoreObjectResponseCode, putObjectResponseCode = _a.putObjectResponseCode, putObjectAclResponseCode = _a.putObjectAclResponseCode, putObjectVersionAclResponseCode = _a.putObjectVersionAclResponseCode, getObjectResponseCode = _a.getObjectResponseCode, getObjectVersionResponseCode = _a.getObjectVersionResponseCode, getObjectAclResponseCode = _a.getObjectAclResponseCode, getObjectVersionAclResponseCode = _a.getObjectVersionAclResponseCode, deleteObjectResponseCode = _a.deleteObjectResponseCode, deleteObjectVersionResponseCode = _a.deleteObjectVersionResponseCode, getBucketVersioningResponseCode = _a.getBucketVersioningResponseCode, getBucketCorsResponseCode = _a.getBucketCorsResponseCode, getBucketAclResponseCode = _a.getBucketAclResponseCode, getBucketObjectLockConfResponseCode = _a.getBucketObjectLockConfResponseCode, getBucketObjectRetentionResponseCode = _a.getBucketObjectRetentionResponseCode, getBucketObjectVersionRetentionResponseCode = _a.getBucketObjectVersionRetentionResponseCode, getReplicationConfigurationResponseCode = _a.getReplicationConfigurationResponseCode, getLifecycleConfigurationResponseCode = _a.getLifecycleConfigurationResponseCode, putLifecycleConfigurationResponseCode = _a.putLifecycleConfigurationResponseCode, putReplicationConfigurationResponseCode = _a.putReplicationConfigurationResponseCode, getObjectLegalHoldResponseCode = _a.getObjectLegalHoldResponseCode, getObjectVersionLegalHoldResponseCode = _a.getObjectVersionLegalHoldResponseCode, getObjectTaggingResponseCode = _a.getObjectTaggingResponseCode, getObjectVersionTaggingResponseCode = _a.getObjectVersionTaggingResponseCode, listObjectsV2ResponseCode = _a.listObjectsV2ResponseCode, listObjectVersionsResponseCode = _a.listObjectVersionsResponseCode, copyObjectResponseCode = _a.copyObjectResponseCode, putObjectRetentionResponseCode = _a.putObjectRetentionResponseCode, putObjectVersionRetentionResponseCode = _a.putObjectVersionRetentionResponseCode, putObjectTaggingResponseCode = _a.putObjectTaggingResponseCode, putObjectLegalHoldTaggingResponseCode = _a.putObjectLegalHoldTaggingResponseCode, putObjectVersionLegalHoldTaggingResponseCode = _a.putObjectVersionLegalHoldTaggingResponseCode, deleteObjectVersionTaggingResponseCode = _a.deleteObjectVersionTaggingResponseCode, putObjectVersionTaggingResponseCode = _a.putObjectVersionTaggingResponseCode, putObjectLockConfigurationResponseCode = _a.putObjectLockConfigurationResponseCode, deleteObjectsResponseCode = _a.deleteObjectsResponseCode, headObjectResponseCode = _a.headObjectResponseCode, getBucketTaggingResponseCode = _a.getBucketTaggingResponseCode, putBucketTaggingResponseCode = _a.putBucketTaggingResponseCode, deleteBucketTaggingResponseCode = _a.deleteBucketTaggingResponseCode;
var testAPIs = [
    {
        API: 'MetadataSearch',
        checkResponse: metadataSearchResponseCode
    },
    {
        API: 'RestoreObject',
        checkResponse: restoreObjectResponseCode
    },
    {
        API: 'PutObject',
        checkResponse: putObjectResponseCode
    },
    {
        API: 'PutObjectAcl',
        checkResponse: putObjectAclResponseCode
    },
    {
        API: 'GetObject',
        checkResponse: getObjectResponseCode
    },
    {
        API: 'GetObjectAcl',
        checkResponse: getObjectAclResponseCode
    },
    {
        API: 'DeleteObject',
        checkResponse: deleteObjectResponseCode
    },
    {
        API: 'GetBucketVersioning',
        checkResponse: getBucketVersioningResponseCode
    },
    {
        API: 'GetBucketCors',
        checkResponse: getBucketCorsResponseCode
    },
    {
        API: 'GetBucketAcl',
        checkResponse: getBucketAclResponseCode
    },
    {
        API: 'GetBucketObjectLockConfiguration',
        checkResponse: getBucketObjectLockConfResponseCode
    },
    {
        API: 'ListObjectsV2',
        checkResponse: listObjectsV2ResponseCode
    },
    {
        API: 'ListObjectVersions',
        checkResponse: listObjectVersionsResponseCode
    },
    {
        API: 'PutObjectLockConfiguration',
        checkResponse: putObjectLockConfigurationResponseCode
    },
    {
        API: 'DeleteObjects',
        checkResponse: deleteObjectsResponseCode
    },
    {
        API: 'GetObjectRetention',
        checkResponse: getBucketObjectRetentionResponseCode
    },
    {
        API: 'GetObjectLegalHold',
        checkResponse: getObjectLegalHoldResponseCode
    },
    {
        API: 'PutObjectRetention',
        checkResponse: putObjectRetentionResponseCode
    },
    {
        API: 'PutObjectLegalHold',
        checkResponse: putObjectLegalHoldTaggingResponseCode
    },
    {
        API: 'HeadObject',
        checkResponse: headObjectResponseCode
    },
    {
        API: 'CopyObject',
        checkResponse: copyObjectResponseCode
    },
    {
        API: 'GetObjectTagging',
        checkResponse: getObjectTaggingResponseCode
    },
    {
        API: 'PutObjectTagging',
        checkResponse: putObjectTaggingResponseCode
    },
    {
        API: 'DeleteObjectVersion',
        checkResponse: deleteObjectVersionResponseCode
    },
    {
        API: 'GetBucketReplication',
        checkResponse: getReplicationConfigurationResponseCode
    },
    {
        API: 'GetBucketLifecycle',
        checkResponse: getLifecycleConfigurationResponseCode
    },
    {
        API: 'PutBucketLifecycle',
        checkResponse: putLifecycleConfigurationResponseCode
    },
    {
        API: 'PutBucketReplication',
        checkResponse: putReplicationConfigurationResponseCode
    },
    {
        API: 'GetObjectVersion',
        checkResponse: getObjectVersionResponseCode
    },
    {
        API: 'GetObjectVersionRetention',
        checkResponse: getBucketObjectVersionRetentionResponseCode
    },
    {
        API: 'PutObjectVersionRetention',
        checkResponse: putObjectVersionRetentionResponseCode
    },
    {
        API: 'GetObjectVersionLegalHold',
        checkResponse: getObjectVersionLegalHoldResponseCode
    },
    {
        API: 'PutObjectVersionLegalHold',
        checkResponse: putObjectVersionLegalHoldTaggingResponseCode
    },
    {
        API: 'GetObjectVersionTagging',
        checkResponse: getObjectVersionTaggingResponseCode
    },
    {
        API: 'DeleteObjectVersionTagging',
        checkResponse: deleteObjectVersionTaggingResponseCode
    },
    {
        API: 'PutObjectVersionTagging',
        checkResponse: putObjectVersionTaggingResponseCode
    },
    {
        API: 'GetObjectVersionAcl',
        checkResponse: getObjectVersionAclResponseCode
    },
    {
        API: 'PutObjectVersionAcl',
        checkResponse: putObjectVersionAclResponseCode
    },
    {
        API: 'GetBucketTagging',
        checkResponse: getBucketTaggingResponseCode
    },
    {
        API: 'PutBucketTagging',
        checkResponse: putBucketTaggingResponseCode
    },
    {
        API: 'DeleteBucketTagging',
        checkResponse: deleteBucketTaggingResponseCode
    },
];
(0, cucumber_1.When)('a {string} tries to perform {string}', function (type, action) {
    var _this = this;
    var _a;
    (_a = testAPIs.find(function (api) { return api.API === action; })) === null || _a === void 0 ? void 0 : _a.checkResponse(this.parameters.AssumedSession, this.saved.bucketName, function (err, res) {
        if (err) {
            assert_1.strict.ifError(err);
            return (err);
        }
        _this.result = res;
    }, 'x'.repeat(10));
});
(0, cucumber_1.Then)('they should be able to execute the API', function () {
    assert_1.strict.notStrictEqual(this.result.code, errors.AccessDenied.message);
});
