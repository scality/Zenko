import { When, Then } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import {EntityType} from "../../world/Zenko";

When('the user tries to perform {string} {string} on the bucket {string} the object', async function (ifS3Standard: string, action: string, ifObject: string) {
    const testAPIs = [
        {
            API: 'MetadataSearch',
            checkResponse: this.metadataSearchResponseCode,
        },
        {
            API: 'RestoreObject',
            checkResponse: this.restoreObjectResponseCode,
        },
        {
            API: 'PutObject',
            checkResponse: this.putObjectResponseCode,
        },
        {
            API: 'PutObjectAcl',
            checkResponse: this.putObjectAclResponseCode,
        },
        {
            API: 'GetObject',
            checkResponse: this.getObjectResponseCode,
        },
        {
            API: 'GetObjectAcl',
            checkResponse: this.getObjectAclResponseCode,
        },
        {
            API: 'DeleteObject',
            checkResponse: this.deleteObjectResponseCode,
        },
        {
            API: 'GetBucketVersioning',
            checkResponse: this.getBucketVersioningResponseCode,
        },
        {
            API: 'GetBucketCors',
            checkResponse: this.getBucketCorsResponseCode,
        },
        {
            API: 'GetBucketAcl',
            checkResponse: this.getBucketAclResponseCode,
        },
        {
            API: 'GetBucketObjectLockConfiguration',
            checkResponse: this.getBucketObjectLockConfResponseCode,
        },
        {
            API: 'ListObjectsV2',
            checkResponse: this.listObjectsV2ResponseCode,
        },
        {
            API: 'ListObjectVersions',
            checkResponse: this.listObjectVersionsResponseCode,
        },
        {
            API: 'PutObjectLockConfiguration',
            checkResponse: this.putObjectLockConfigurationResponseCode,
        },
        {
            API: 'DeleteObjects',
            checkResponse: this.deleteObjectsResponseCode,
        },
        {
            API: 'GetObjectRetention',
            checkResponse: this.getBucketObjectRetentionResponseCode,
        },
        {
            API: 'GetObjectLegalHold',
            checkResponse: this.getObjectLegalHoldResponseCode,
        },
        {
            API: 'PutObjectRetention',
            checkResponse: this.putObjectRetentionResponseCode,
        },
        {
            API: 'PutObjectLegalHold',
            checkResponse: this.putObjectLegalHoldTaggingResponseCode,
        },
        {
            API: 'HeadObject',
            checkResponse: this.headObjectResponseCode,
        },
        {
            API: 'CopyObject',
            checkResponse: this.copyObjectResponseCode,
        },
        {
            API: 'GetObjectTagging',
            checkResponse: this.getObjectTaggingResponseCode,
        },
        {
            API: 'PutObjectTagging',
            checkResponse: this.putObjectTaggingResponseCode,
        },
        {
            API: 'DeleteObjectVersion',
            checkResponse: this.deleteObjectVersionResponseCode,
        },
        {
            API: 'GetBucketReplication',
            checkResponse: this.getReplicationConfigurationResponseCode,
        },
        {
            API: 'GetBucketLifecycle',
            checkResponse: this.getLifecycleConfigurationResponseCode,
        },
        {
            API: 'PutBucketLifecycle',
            checkResponse: this.putLifecycleConfigurationResponseCode,
        },
        {
            API: 'PutBucketReplication',
            checkResponse: this.putReplicationConfigurationResponseCode,
        },
        {
            API: 'GetObjectVersion',
            checkResponse: this.getObjectResponseCode,
        },
        {
            API: 'GetObjectVersionRetention',
            checkResponse: this.getBucketObjectRetentionResponseCode,
        },
        {
            API: 'PutObjectVersionRetention',
            checkResponse: this.putObjectRetentionResponseCode,
        },
        {
            API: 'GetObjectVersionLegalHold',
            checkResponse: this.getObjectVersionLegalHoldResponseCode,
        },
        {
            API: 'PutObjectVersionLegalHold',
            checkResponse: this.putObjectLegalHoldTaggingResponseCode,
        },
        {
            API: 'GetObjectVersionTagging',
            checkResponse: this.getObjectVersionTaggingResponseCode,
        },
        {
            API: 'DeleteObjectVersionTagging',
            checkResponse: this.deleteObjectVersionTaggingResponseCode,
        },
        {
            API: 'PutObjectVersionTagging',
            checkResponse: this.putObjectTaggingResponseCode,
        },
        {
            API: 'GetObjectVersionAcl',
            checkResponse: this.getObjectAclResponseCode,
        },
        {
            API: 'PutObjectVersionAcl',
            checkResponse: this.putObjectAclResponseCode,
        },
        {
            API: 'GetBucketTagging',
            checkResponse: this.getBucketTaggingResponseCode,
        },
        {
            API: 'PutBucketTagging',
            checkResponse: this.putBucketTaggingResponseCode,
        },
        {
            API: 'DeleteBucketTagging',
            checkResponse: this.deleteBucketTaggingResponseCode,
        },
    ];
    
    let userCredentials;
    if ([EntityType.IAM_USER, EntityType.ACCOUNT].includes(this.saved.type)) {
        userCredentials = this.parameters.IAMSession;
    } else {
        userCredentials = this.parameters.AssumedSession;
    }
    console.log("userCredentialsuserCredentialsuserCredentials");
    console.log(userCredentials);
    console.log("thisthisthis");
    console.log(this);
    if (ifS3Standard === 'notS3Standard'){
        this.saved.ifS3Standard = false;
        const api = testAPIs.find(api => api.API === action);
        // Handle Metadatasearch special case
        if (action === 'MetadataSearch') {
            this.result = await this.metadataSearchResponseCode(userCredentials, this.saved.bucketName);
        }
        // Handle other cases
        else if (api) {
            this.result = await api.checkResponse();
        }
    } else {
        this.resetCommand();
        this.saved.ifS3Standard = true;
        this.addCommandParameter({bucket: this.saved.bucketName});
        if (ifObject === 'with') {
            this.addCommandParameter({key: this.saved.objectName});
        }
        this.result = await this.restoreObjectResponseCode();
    }
});

Then('the user should be able to perform successfully', function () {
    this.endForType();
    if (this.saved.ifS3Standard) {
        assert.strictEqual(this.result?.err?.includes("AccessDenied"), false);
    } else {
        assert.strictEqual(this.result?.statusCode, 200);
    }
});