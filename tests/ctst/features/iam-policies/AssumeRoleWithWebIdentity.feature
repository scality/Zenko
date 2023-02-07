Feature: Assume Role with Web Identity
    In order to interact with restricted APIs
    As an Artesca User
    I want to use a web identity
    And to subscribe to events I want to be notified on
    And to receive notifications on buckets/objects activities I have subscribed to

  @2.6.0
  @PreMerge
  @BucketNotification
  Scenario Outline: Assume Role with Web Identity
    Given a "<type>"
    And a "<versioning>" bucket
    And a file
    When a "<type>" tries to perform "<action>"
    Then they should be able to perform "<action>"

    Examples:
    | action                           | type                  | versioning    |
    | MetadataSearch                   | STORAGE_MANAGER       | Non versioned |
    | RestoreObject                    | STORAGE_MANAGER       | Non versioned |
    | PutObject                        | STORAGE_MANAGER       | Non versioned |
    | PutObjectAcl                     | STORAGE_MANAGER       | Non versioned |
    | GetObject                        | STORAGE_MANAGER       | Non versioned |
    | GetObjectAcl                     | STORAGE_MANAGER       | Non versioned |
    | DeleteObject                     | STORAGE_MANAGER       | Non versioned |
    | GetBucketVersioning              | STORAGE_MANAGER       | Non versioned |
    | GetBucketCors                    | STORAGE_MANAGER       | Non versioned |
    | GetBucketAcl                     | STORAGE_MANAGER       | Non versioned |
    | GetBucketObjectLockConfiguration | STORAGE_MANAGER       | Non versioned |
    | ListObjectsV2                    | STORAGE_MANAGER       | Non versioned |
    | ListObjectVersions               | STORAGE_MANAGER       | Non versioned |
    | PutObjectLockConfiguration       | STORAGE_MANAGER       | Non versioned |
    | DeleteObjects                    | STORAGE_MANAGER       | Non versioned |
    | GetObjectRetention               | STORAGE_MANAGER       | Non versioned |
    | GetObjectLegalHold               | STORAGE_MANAGER       | Non versioned |
    | PutObjectRetention               | STORAGE_MANAGER       | Non versioned |
    | PutObjectLegalHold               | STORAGE_MANAGER       | Non versioned |
    | HeadObject                       | STORAGE_MANAGER       | Non versioned |
    | CopyObject                       | STORAGE_MANAGER       | Non versioned |
    | GetObjectTagging                 | STORAGE_MANAGER       | Non versioned |
    | PutObjectTagging                 | STORAGE_MANAGER       | Non versioned |
    | DeleteObjectVersion              | STORAGE_MANAGER       | Non versioned |
    | GetBucketReplication             | STORAGE_MANAGER       | Non versioned |
    | GetBucketLifecycle               | STORAGE_MANAGER       | Non versioned |
    | PutBucketLifecycle               | STORAGE_MANAGER       | Non versioned |
    | PutBucketReplication             | STORAGE_MANAGER       | Non versioned |
    | GetObjectVersion                 | STORAGE_MANAGER       | Non versioned |
    | GetObjectVersionRetention        | STORAGE_MANAGER       | Non versioned |
    | PutObjectVersionRetention        | STORAGE_MANAGER       | Non versioned |
    | GetObjectVersionLegalHold        | STORAGE_MANAGER       | Non versioned |
    | PutObjectVersionLegalHold        | STORAGE_MANAGER       | Non versioned |
    | GetObjectVersionTagging          | STORAGE_MANAGER       | Non versioned |
    | DeleteObjectVersionTagging       | STORAGE_MANAGER       | Non versioned |
    | PutObjectVersionTagging          | STORAGE_MANAGER       | Non versioned |
    | GetObjectVersionAcl              | STORAGE_MANAGER       | Non versioned |
    | PutObjectVersionAcl              | STORAGE_MANAGER       | Non versioned |
    | GetBucketTagging                 | STORAGE_MANAGER       | Non versioned |
    | PutBucketTagging                 | STORAGE_MANAGER       | Non versioned |
    | DeleteBucketTagging              | STORAGE_MANAGER       | Non versioned |
    | MetadataSearch                   | STORAGE_ACCOUNT_OWNER | Non versioned |
    | RestoreObject                    | STORAGE_ACCOUNT_OWNER | Non versioned |
    | PutObject                        | STORAGE_ACCOUNT_OWNER | Non versioned |
    | PutObjectAcl                     | STORAGE_ACCOUNT_OWNER | Non versioned |
    | GetObject                        | STORAGE_ACCOUNT_OWNER | Non versioned |
    | GetObjectAcl                     | STORAGE_ACCOUNT_OWNER | Non versioned |
    | DeleteObject                     | STORAGE_ACCOUNT_OWNER | Non versioned |
    | GetBucketVersioning              | STORAGE_ACCOUNT_OWNER | Non versioned |
    | GetBucketCors                    | STORAGE_ACCOUNT_OWNER | Non versioned |
    | GetBucketAcl                     | STORAGE_ACCOUNT_OWNER | Non versioned |
    | GetBucketObjectLockConfiguration | STORAGE_ACCOUNT_OWNER | Non versioned |
    | ListObjectsV2                    | STORAGE_ACCOUNT_OWNER | Non versioned |
    | ListObjectVersions               | STORAGE_ACCOUNT_OWNER | Non versioned |
    | PutObjectLockConfiguration       | STORAGE_ACCOUNT_OWNER | Non versioned |
    | DeleteObjects                    | STORAGE_ACCOUNT_OWNER | Non versioned |
    | GetObjectRetention               | STORAGE_ACCOUNT_OWNER | Non versioned |
    | GetObjectLegalHold               | STORAGE_ACCOUNT_OWNER | Non versioned |
    | PutObjectRetention               | STORAGE_ACCOUNT_OWNER | Non versioned |
    | PutObjectLegalHold               | STORAGE_ACCOUNT_OWNER | Non versioned |
    | HeadObject                       | STORAGE_ACCOUNT_OWNER | Non versioned |
    | CopyObject                       | STORAGE_ACCOUNT_OWNER | Non versioned |
    | GetObjectTagging                 | STORAGE_ACCOUNT_OWNER | Non versioned |
    | PutObjectTagging                 | STORAGE_ACCOUNT_OWNER | Non versioned |
    | DeleteObjectVersion              | STORAGE_ACCOUNT_OWNER | Non versioned |
    | GetBucketReplication             | STORAGE_ACCOUNT_OWNER | Non versioned |
    | GetBucketLifecycle               | STORAGE_ACCOUNT_OWNER | Non versioned |
    | PutBucketLifecycle               | STORAGE_ACCOUNT_OWNER | Non versioned |
    | PutBucketReplication             | STORAGE_ACCOUNT_OWNER | Non versioned |
    | GetObjectVersion                 | STORAGE_ACCOUNT_OWNER | Non versioned |
    | GetObjectVersionRetention        | STORAGE_ACCOUNT_OWNER | Non versioned |
    | PutObjectVersionRetention        | STORAGE_ACCOUNT_OWNER | Non versioned |
    | GetObjectVersionLegalHold        | STORAGE_ACCOUNT_OWNER | Non versioned |
    | PutObjectVersionLegalHold        | STORAGE_ACCOUNT_OWNER | Non versioned |
    | GetObjectVersionTagging          | STORAGE_ACCOUNT_OWNER | Non versioned |
    | DeleteObjectVersionTagging       | STORAGE_ACCOUNT_OWNER | Non versioned |
    | PutObjectVersionTagging          | STORAGE_ACCOUNT_OWNER | Non versioned |
    | GetObjectVersionAcl              | STORAGE_ACCOUNT_OWNER | Non versioned |
    | PutObjectVersionAcl              | STORAGE_ACCOUNT_OWNER | Non versioned |
    | GetBucketTagging                 | STORAGE_ACCOUNT_OWNER | Non versioned |
    | PutBucketTagging                 | STORAGE_ACCOUNT_OWNER | Non versioned |
    | DeleteBucketTagging              | STORAGE_ACCOUNT_OWNER | Non versioned |
    | MetadataSearch                   | DATA_CONSUMER         | Non versioned |
    | RestoreObject                    | DATA_CONSUMER         | Non versioned |
    | PutObject                        | DATA_CONSUMER         | Non versioned |
    | PutObjectAcl                     | DATA_CONSUMER         | Non versioned |
    | GetObject                        | DATA_CONSUMER         | Non versioned |
    | GetObjectAcl                     | DATA_CONSUMER         | Non versioned |
    | DeleteObject                     | DATA_CONSUMER         | Non versioned |
    | GetBucketVersioning              | DATA_CONSUMER         | Non versioned |
    | GetBucketCors                    | DATA_CONSUMER         | Non versioned |
    | GetBucketAcl                     | DATA_CONSUMER         | Non versioned |
    | GetBucketObjectLockConfiguration | DATA_CONSUMER         | Non versioned |
    | ListObjectsV2                    | DATA_CONSUMER         | Non versioned |
    | ListObjectVersions               | DATA_CONSUMER         | Non versioned |
    | PutObjectLockConfiguration       | DATA_CONSUMER         | Non versioned |
    | DeleteObjects                    | DATA_CONSUMER         | Non versioned |
    | GetObjectRetention               | DATA_CONSUMER         | Non versioned |
    | GetObjectLegalHold               | DATA_CONSUMER         | Non versioned |
    | PutObjectRetention               | DATA_CONSUMER         | Non versioned |
    | PutObjectLegalHold               | DATA_CONSUMER         | Non versioned |
    | HeadObject                       | DATA_CONSUMER         | Non versioned |
    | CopyObject                       | DATA_CONSUMER         | Non versioned |
    | GetObjectTagging                 | DATA_CONSUMER         | Non versioned |
    | PutObjectTagging                 | DATA_CONSUMER         | Non versioned |
    | DeleteObjectVersion              | DATA_CONSUMER         | Non versioned |
    | GetBucketReplication             | DATA_CONSUMER         | Non versioned |
    | GetBucketLifecycle               | DATA_CONSUMER         | Non versioned |
    | PutBucketLifecycle               | DATA_CONSUMER         | Non versioned |
    | PutBucketReplication             | DATA_CONSUMER         | Non versioned |
    | GetObjectVersion                 | DATA_CONSUMER         | Non versioned |
    | GetObjectVersionRetention        | DATA_CONSUMER         | Non versioned |
    | PutObjectVersionRetention        | DATA_CONSUMER         | Non versioned |
    | GetObjectVersionLegalHold        | DATA_CONSUMER         | Non versioned |
    | PutObjectVersionLegalHold        | DATA_CONSUMER         | Non versioned |
    | GetObjectVersionTagging          | DATA_CONSUMER         | Non versioned |
    | DeleteObjectVersionTagging       | DATA_CONSUMER         | Non versioned |
    | PutObjectVersionTagging          | DATA_CONSUMER         | Non versioned |
    | GetObjectVersionAcl              | DATA_CONSUMER         | Non versioned |
    | PutObjectVersionAcl              | DATA_CONSUMER         | Non versioned |
    | GetBucketTagging                 | DATA_CONSUMER         | Non versioned |
    | PutBucketTagging                 | DATA_CONSUMER         | Non versioned |
    | DeleteBucketTagging              | DATA_CONSUMER         | Non versioned |