import { When, Then } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import {EntityType} from "../../world/Zenko";

When('the user tries to perform {string} {string} on the bucket', async function (ifS3Standard: string, action: string) {
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
            checkResponse: this.getObjectLegalHoldResponseCode,
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
    // console.log("userCredentialsuserCredentialsuserCredentials");
    // console.log(userCredentials);
    // console.log("thisthisthis");
    // console.log(this);
    const api = testAPIs.find(api => api.API === action);
    if (ifS3Standard === 'notS3Standard'){
        this.saved.ifS3Standard = false;
        // Handle Metadatasearch special case
        console.log("THIS SAVED BUCKET NAME IS: ", this.saved.bucketName);
        if (action === 'MetadataSearch') {
            this.result = await this.metadataSearchResponseCode(userCredentials, this.saved.bucketName);
        }
        // Handle other cases
    } else if (api) {
        this.resetCommand();
        this.saved.ifS3Standard = true;
        this.addCommandParameter({bucket: this.saved.bucketName});
        if (this.saved.objectName && this.saved.objectName != '') {
            this.addCommandParameter({key: this.saved.objectName});
        }
        const boundCheckResponse = api.checkResponse.bind(this);
        this.result = await boundCheckResponse();
    }
});

Then('the user should be able to perform successfully', function () {
    this.endForType();
    if (this.saved.ifS3Standard) {
        assert.strictEqual(this.result?.err?.includes("AccessDenied"), false);
    } else {
        console.log("RESULT: ", this.result);
        assert.strictEqual(this.result?.statusCode, 200);
    }
});