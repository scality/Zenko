# This file was generated using generate.js

Feature: S3 Bucket Policies Authorization flow for IAM Users
    This feature allows you to create and attach bucket policies to S3 buckets.
    IAM Users should have the permissions to perform the actions that they are granted in their bucket policies
    based on the other permissions they also have.
    This test suite is not meant to be human-readable, but brings confidence in our Authz flow for all supported
    S3 actions.

    @2.6.0
    @PreMerge
    @BucketPolicies
    @BP-Account
    Scenario Outline: IAM USER: <iamPolicyExists> <iamPolicyApplies> <iamPolicyEffect> IAM Policy and <bucketPolicyExists> <bucketPolicyApplies> <bucketPolicyEffect> S3 Bucket Policy
        Given an action "<action>"
        And an existing bucket prepared for the action
        And a "IAM_USER" type
        And an "<iamPolicyExists>" IAM Policy that "<iamPolicyApplies>" with "<iamPolicyEffect>" effect for the current API
        And an "<bucketPolicyExists>" S3 Bucket Policy that "<bucketPolicyApplies>" with "<bucketPolicyEffect>" effect for the current API
        When the user tries to perform the current S3 action on the bucket
        Then the authorization result is correct
        Examples:
            | action                             | iamPolicyExists | iamPolicyApplies | iamPolicyEffect | bucketPolicyExists | bucketPolicyApplies | bucketPolicyEffect |
            # Everything below is generated
            | AbortMultipartUpload               | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | CompleteMultipartUpload            | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | CopyObject                         | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | CreateBucket                       | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | CreateMultipartUpload              | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteBucket                       | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteBucketCors                   | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteBucketEncryption             | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteBucketLifecycle              | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteBucketPolicy                 | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteBucketReplication            | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteBucketWebsite                | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteObject                       | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteObjectTagging                | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteObjects                      | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetBucketAcl                       | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetBucketCors                      | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetBucketEncryption                | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetBucketLifecycleConfiguration    | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetBucketNotificationConfiguration | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetBucketPolicy                    | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetBucketReplication               | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetBucketVersioning                | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetObject                          | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetObjectAcl                       | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetObjectLegalHold                 | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetObjectLockConfiguration         | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetObjectRetention                 | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetObjectTagging                   | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | HeadBucket                         | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | HeadObject                         | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | ListMultipartUploads               | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | ListObjectVersions                 | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | ListObjects                        | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | ListObjectsV2                      | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutBucketAcl                       | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutBucketCors                      | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutBucketEncryption                | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutBucketLifecycleConfiguration    | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutBucketNotificationConfiguration | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutBucketPolicy                    | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutBucketReplication               | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutBucketVersioning                | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutObject                          | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutObjectAcl                       | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutObjectLegalHold                 | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutObjectLockConfiguration         | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutObjectRetention                 | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutObjectTagging                   | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | UploadPart                         | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | MetadataSearch                     | existing        | applies          | DENY            | existing           | applies             | ALLOW              |


    Scenario Outline: ASSUME ROLE: <iamPolicyExists> <iamPolicyApplies> <iamPolicyEffect> IAM Policy and <bucketPolicyExists> <bucketPolicyApplies> <bucketPolicyEffect> S3 Bucket Policy
        Given an action "<action>"
        And an existing bucket prepared for the action
        And a "ASSUME_ROLE_USER" type
        And an "<iamPolicyExists>" IAM Policy that "<iamPolicyApplies>" with "<iamPolicyEffect>" effect for the current API
        And an "<bucketPolicyExists>" S3 Bucket Policy that "<bucketPolicyApplies>" with "<bucketPolicyEffect>" effect for the current API
        When the user tries to perform the current S3 action on the bucket
        Then the authorization result is correct
        Examples:
            | action                             | iamPolicyExists | iamPolicyApplies | iamPolicyEffect | bucketPolicyExists | bucketPolicyApplies | bucketPolicyEffect |
            # Everything below is generated
            | AbortMultipartUpload               | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | CompleteMultipartUpload            | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | CopyObject                         | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | CreateBucket                       | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | CreateMultipartUpload              | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteBucket                       | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteBucketCors                   | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteBucketEncryption             | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteBucketLifecycle              | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteBucketPolicy                 | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteBucketReplication            | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteBucketWebsite                | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteObject                       | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteObjectTagging                | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | DeleteObjects                      | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetBucketAcl                       | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetBucketCors                      | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetBucketEncryption                | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetBucketLifecycleConfiguration    | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetBucketNotificationConfiguration | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetBucketPolicy                    | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetBucketReplication               | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetBucketVersioning                | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetObject                          | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetObjectAcl                       | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetObjectLegalHold                 | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetObjectLockConfiguration         | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetObjectRetention                 | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | GetObjectTagging                   | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | HeadBucket                         | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | HeadObject                         | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | ListMultipartUploads               | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | ListObjectVersions                 | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | ListObjects                        | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | ListObjectsV2                      | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutBucketAcl                       | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutBucketCors                      | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutBucketEncryption                | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutBucketLifecycleConfiguration    | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutBucketNotificationConfiguration | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutBucketPolicy                    | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutBucketReplication               | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutBucketVersioning                | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutObject                          | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutObjectAcl                       | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutObjectLegalHold                 | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutObjectLockConfiguration         | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutObjectRetention                 | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | PutObjectTagging                   | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | UploadPart                         | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
            | MetadataSearch                     | existing        | applies          | DENY            | existing           | applies             | ALLOW              |
