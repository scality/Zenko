Feature: S3 Bucket Policies Authorization flow use cases
    Bucket policies feature should ensure the customer use cases are
    supported.

    # Implement use case from ARTESCA-6574
    Scenario Outline: Use case : bucket policy, all access, <action>
        Given an action "<action>"
        And an existing bucket prepared for the action
        And a IAM_USER type
        And an environment setup for the API
        And an "non-existing" IAM Policy that "" with "" effect for the current API
        And a pre-created policy granting full access to the bucket
        When the user tries to perform the current S3 action on the bucket
        Then the authorization result is correct

        Examples:
            | action                             |
            | AbortMultipartUpload               |
            | CompleteMultipartUpload            |
            | CopyObject                         |
            | CreateMultipartUpload              |
            | DeleteBucket                       |
            | DeleteBucketCors                   |
            | DeleteBucketEncryption             |
            | DeleteBucketLifecycle              |
            | DeleteBucketPolicy                 |
            | DeleteBucketReplication            |
            | DeleteBucketWebsite                |
            | DeleteObject                       |
            | DeleteBucketTagging                |
            | DeleteObjectTagging                |
            | DeleteObjects                      |
            | GetBucketAcl                       |
            | GetBucketCors                      |
            | GetBucketEncryption                |
            | GetBucketLifecycleConfiguration    |
            | GetBucketNotificationConfiguration |
            | GetBucketPolicy                    |
            | GetBucketReplication               |
            | GetBucketVersioning                |
            | GetObject                          |
            | GetObjectAcl                       |
            | GetObjectLegalHold                 |
            | GetObjectLockConfiguration         |
            | GetObjectRetention                 |
            | GetBucketTagging                   |
            | GetObjectTagging                   |
            | HeadBucket                         |
            | HeadObject                         |
            | ListMultipartUploads               |
            | ListObjectVersions                 |
            | ListObjects                        |
            | ListObjectsV2                      |
            | PutBucketAcl                       |
            | PutBucketCors                      |
            | PutBucketEncryption                |
            | PutBucketLifecycleConfiguration    |
            | PutBucketNotificationConfiguration |
            | PutBucketPolicy                    |
            | PutBucketReplication               |
            | PutBucketVersioning                |
            | PutObject                          |
            | PutObjectAcl                       |
            | PutObjectLegalHold                 |
            | PutObjectLockConfiguration         |
            | PutObjectRetention                 |
            | PutBucketTagging                   |
            | PutObjectTagging                   |
            | UploadPart                         |
            | UploadPartCopy                     |
            | DeleteObjectVersion                |
            | DeleteObjectVersionTagging         |
            | GetObjectVersion                   |
            | GetObjectVersionAcl                |
            | GetObjectVersionTagging            |
            | PutObjectVersionAcl                |
            | PutObjectVersionTagging            |
            | PutObjectVersionRetention          |
            | PutObjectVersionLegalHold          |
            | MetadataSearch                     |
