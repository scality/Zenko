Feature: S3 Bucket Policies Authorization flow
    This feature allows you to create and attach bucket policies to S3 buckets.
    Entites should have the permissions to perform the actions that they are granted in their bucket policies
    based on the other permissions they also have.

  @2.6.0
  @PreMerge
  @BucketPolicies
    Given an action:
        | action                             | withObjectLock | withVersioning | retentionMode | preExistingObject |
        # special
        | AbortMultipartUpload               | without        | without        | without       | without           |
        # special
        | CompleteMultipartUpload            | without        | without        | without       | without           |
        # special
        | CopyObject                         | without        | without        | without       | with              |
        # special
        | CreateBucket                       | without        | without        | without       | without           |
        | CreateMultipartUpload              | without        | without        | without       | without           |
        | DeleteBucket                       | without        | without        | without       | without           |
        | DeleteBucketCors                   | without        | without        | without       | without           |
        | DeleteBucketEncryption             | without        | without        | without       | without           |
        | DeleteBucketLifecycle              | without        | without        | without       | without           |
        | DeleteBucketPolicy                 | without        | without        | without       | without           |
        | DeleteBucketReplication            | without        | without        | without       | without           |
        | DeleteBucketWebsite                | without        | without        | without       | without           |
        | DeleteObject                       | without        | without        | without       | with              |
        | DeleteObjectTagging                | without        | without        | without       | with              |
        | DeleteObjects                      | without        | without        | without       | with              |
        | GetBucketAcl                       | without        | without        | without       | without           |
        | GetBucketCors                      | without        | without        | without       | without           |
        | GetBucketEncryption                | without        | without        | without       | without           |
        | GetBucketLifecycleConfiguration    | without        | without        | without       | without           |
        | GetBucketNotificationConfiguration | without        | without        | without       | without           |
        | GetBucketPolicy                    | without        | without        | without       | without           |
        | GetBucketReplication               | without        | without        | without       | without           |
        | GetBucketVersioning                | without        | without        | without       | without           |
        | GetObject                          | without        | without        | without       | with              |
        | GetObjectAcl                       | without        | without        | without       | with              |
        | GetObjectLegalHold                 | with           | without        | without       | with              |
        | GetObjectLockConfiguration         | with           | without        | without       | with              |
        | GetObjectRetention                 | with           | without        | without       | with              |
        | GetObjectTagging                   | without        | without        | without       | with              |
        | HeadBucket                         | without        | without        | without       | without           |
        | HeadObject                         | without        | without        | without       | without           |
        | ListMultipartUploads               | without        | without        | without       | without           |
        | ListObjectVersions                 | without        | without        | without       | without           |
        | ListObjects                        | without        | without        | without       | without           |
        | ListObjectsV2                      | without        | without        | without       | without           |
        | PutBucketAcl                       | without        | without        | without       | without           |
        | PutBucketCors                      | without        | without        | without       | without           |
        | PutBucketEncryption                | without        | without        | without       | without           |
        | PutBucketLifecycleConfiguration    | without        | without        | without       | without           |
        | PutBucketNotificationConfiguration | without        | without        | without       | without           |
        | PutBucketPolicy                    | without        | without        | without       | without           |
        # special
        | PutBucketReplication               | without        | without        | without       | without           |
        | PutBucketVersioning                | without        | without        | without       | without           |
        | PutObject                          | without        | without        | without       | without           |
        | PutObjectAcl                       | without        | without        | without       | with              |
        | PutObjectLegalHold                 | with           | without        | without       | with              |
        | PutObjectLockConfiguration         | with           | without        | without       | without           |
        | PutObjectRetention                 | with           | without        | without       | with              |
        | PutObjectTagging                   | without        | without        | without       | with              |
        # special
        | UploadPart                         | without        | without        | without       | without           |
        | MetadataSearch                     | without        | without        | without       | without           |
    And an existing bucket with saved configuration
    And a <type> type:
        | type                        |
        | ACCOUNT                     |
        | IAM_USER                    |
        | ASSUME_ROLE                 |
        | ASSUME_ROLE_CROSS_ACCOUNT   |
        # Act as AssumeRoleWithWebIdentity checks
        | STORAGE_MANAGER             |
    And an "<doesExists>" S3 Bucket Policy that "<doesApply>" with "<isAllow>" effect for the current API:
        | doesExists   | doesApply      | isAllow |
        | existing     | applies        | ALLOW   |
        | existing     | applies        | DENY    |
        | existing     | does not apply | ALLOW   |
        | existing     | does not apply | DENY    |
        | non-existing | /              | /       |
    And an "<doesExists>" IAM Policy that "<doesApply>" with "<isAllow>" effect for the current API:
        | doesExists | doesApply      | isAllow    |
        | existing     | applies        | ALLOW      |
        | existing     | applies        | DENY       |
        | existing     | applies        | ALLOW+DENY |
        | existing     | does not apply | ALLOW      |
        | existing     | does not apply | DENY       |
        | existing     | does not apply | ALLOW+DENY |
        | non-existing | /              | /          |
    When the user tries to perform the current S3 action on the bucket
    # The test will dynamically track the expected output, knowing all the permission we dynamically set
    Then the authorization result is correct

# Test additional APIs with additional Authz checks
# Test additional ACLs-related stuff
# Test CNES-specific scenarios: https://scality.atlassian.net/browse/ARTESCA-6574