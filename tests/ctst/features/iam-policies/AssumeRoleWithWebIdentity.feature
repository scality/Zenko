Feature: Assume Role with Web Identity
    In order to interact with restricted APIs
    As an Artesca User
    I want to use a web identity
    And to subscribe to events I want to be notified on
    And to receive notifications on buckets/objects activities I have subscribed to

  @2.6.0
  @PreMerge
  @IAM-Policies-ARWWI
  Scenario Outline: Assume Role with Web Identity
    Given an existing bucket "" "<withVersioning>" versioning
    And an object that "<objectExists>" "<withVersionId>" version-Id
    And a <type> type
    When the user tries to perform "<ifS3Standard>" "<action>" on the bucket
    Then the user should be able to perform successfully the "<action>" action

    Examples:
      | action                     | type                  | ifS3Standard  | withVersioning | objectExists   | withVersionId |
      | MetadataSearch             | STORAGE_MANAGER       | notS3Standard | without        | does not exist |               |
      | PutObject                  | STORAGE_MANAGER       | S3Standard    | without        | does not exist |               |
      | PutObjectAcl               | STORAGE_MANAGER       | S3Standard    | without        | does not exist |               |
      | GetObject                  | STORAGE_MANAGER       | S3Standard    | without        | exists         |               |
      | GetObjectAcl               | STORAGE_MANAGER       | S3Standard    | without        | exists         |               |
      | DeleteObject               | STORAGE_MANAGER       | S3Standard    | without        | exists         |               |
      | GetBucketVersioning        | STORAGE_MANAGER       | S3Standard    | with           | does not exist |               |
      | GetBucketAcl               | STORAGE_MANAGER       | S3Standard    | without        | does not exist |               |
      | ListObjectsV2              | STORAGE_MANAGER       | S3Standard    | without        | exists         |               |
      | ListObjectVersions         | STORAGE_MANAGER       | S3Standard    | with           | exists         | with          |
      | PutObjectLockConfiguration | STORAGE_MANAGER       | S3Standard    | without        | does not exist |               |
      | DeleteObjects              | STORAGE_MANAGER       | S3Standard    | without        | exists         |               |
      | HeadObject                 | STORAGE_MANAGER       | S3Standard    | without        | exists         |               |
      | CopyObject                 | STORAGE_MANAGER       | S3Standard    | without        | exists         |               |
      | GetObjectTagging           | STORAGE_MANAGER       | S3Standard    | without        | exists         |               |
      | PutObjectTagging           | STORAGE_MANAGER       | S3Standard    | without        | exists         |               |
      | DeleteObjectVersion        | STORAGE_MANAGER       | S3Standard    | with           | exists         | with          |
      | PutBucketLifecycle         | STORAGE_MANAGER       | S3Standard    | without        | does not exist |               |
      | PutBucketReplication       | STORAGE_MANAGER       | S3Standard    | with           | does not exist |               |
      | GetObjectVersion           | STORAGE_MANAGER       | S3Standard    | with           | exists         | with          |
      | GetObjectVersionTagging    | STORAGE_MANAGER       | S3Standard    | with           | exists         | with          |
      | DeleteObjectVersionTagging | STORAGE_MANAGER       | S3Standard    | with           | exists         | with          |
      | PutObjectVersionTagging    | STORAGE_MANAGER       | S3Standard    | with           | exists         | with          |
      | GetObjectVersionAcl        | STORAGE_MANAGER       | S3Standard    | with           | exists         | with          |
      | PutObjectVersionAcl        | STORAGE_MANAGER       | S3Standard    | with           | exists         | with          |
      | PutBucketTagging           | STORAGE_MANAGER       | S3Standard    | without        | does not exist |               |
      | DeleteBucketTagging        | STORAGE_MANAGER       | S3Standard    | without        | does not exist |               |
      | MetadataSearch             | STORAGE_ACCOUNT_OWNER | notS3Standard | without        | does not exist |               |
      | PutObject                  | STORAGE_ACCOUNT_OWNER | S3Standard    | without        | does not exist |               |
      | PutObjectAcl               | STORAGE_ACCOUNT_OWNER | S3Standard    | without        | does not exist |               |
      | GetObject                  | STORAGE_ACCOUNT_OWNER | S3Standard    | without        | exists         |               |
      | GetObjectAcl               | STORAGE_ACCOUNT_OWNER | S3Standard    | without        | exists         |               |
      | DeleteObject               | STORAGE_ACCOUNT_OWNER | S3Standard    | without        | exists         |               |
      | GetBucketVersioning        | STORAGE_ACCOUNT_OWNER | S3Standard    | with           | does not exist |               |
      | GetBucketAcl               | STORAGE_ACCOUNT_OWNER | S3Standard    | without        | does not exist |               |
      | ListObjectsV2              | STORAGE_ACCOUNT_OWNER | S3Standard    | without        | exists         |               |
      | ListObjectVersions         | STORAGE_ACCOUNT_OWNER | S3Standard    | with           | exists         | with          |
      | PutObjectLockConfiguration | STORAGE_ACCOUNT_OWNER | S3Standard    | without        | does not exist |               |
      | DeleteObjects              | STORAGE_ACCOUNT_OWNER | S3Standard    | without        | exists         |               |
      | HeadObject                 | STORAGE_ACCOUNT_OWNER | S3Standard    | without        | exists         |               |
      | CopyObject                 | STORAGE_ACCOUNT_OWNER | S3Standard    | without        | exists         |               |
      | GetObjectTagging           | STORAGE_ACCOUNT_OWNER | S3Standard    | without        | exists         |               |
      | PutObjectTagging           | STORAGE_ACCOUNT_OWNER | S3Standard    | without        | exists         |               |
      | DeleteObjectVersion        | STORAGE_ACCOUNT_OWNER | S3Standard    | with           | exists         | with          |
      | PutBucketLifecycle         | STORAGE_ACCOUNT_OWNER | S3Standard    | without        | does not exist |               |
      | PutBucketReplication       | STORAGE_ACCOUNT_OWNER | S3Standard    | with           | does not exist |               |
      | GetObjectVersion           | STORAGE_ACCOUNT_OWNER | S3Standard    | with           | exists         | with          |
      | GetObjectVersionTagging    | STORAGE_ACCOUNT_OWNER | S3Standard    | with           | exists         | with          |
      | DeleteObjectVersionTagging | STORAGE_ACCOUNT_OWNER | S3Standard    | with           | exists         | with          |
      | PutObjectVersionTagging    | STORAGE_ACCOUNT_OWNER | S3Standard    | with           | exists         | with          |
      | GetObjectVersionAcl        | STORAGE_ACCOUNT_OWNER | S3Standard    | with           | exists         | with          |
      | PutObjectVersionAcl        | STORAGE_ACCOUNT_OWNER | S3Standard    | with           | exists         | with          |
      | PutBucketTagging           | STORAGE_ACCOUNT_OWNER | S3Standard    | without        | does not exist |               |
      | DeleteBucketTagging        | STORAGE_ACCOUNT_OWNER | S3Standard    | without        | does not exist |               |
      | MetadataSearch             | DATA_CONSUMER         | notS3Standard | without        | does not exist |               |
      | PutObject                  | DATA_CONSUMER         | S3Standard    | without        | does not exist |               |
      | PutObjectAcl               | DATA_CONSUMER         | S3Standard    | without        | does not exist |               |
      | GetObject                  | DATA_CONSUMER         | S3Standard    | without        | exists         |               |
      | GetObjectAcl               | DATA_CONSUMER         | S3Standard    | without        | exists         |               |
      | DeleteObject               | DATA_CONSUMER         | S3Standard    | without        | exists         |               |
      | GetBucketVersioning        | DATA_CONSUMER         | S3Standard    | with           | does not exist |               |
      | GetBucketAcl               | DATA_CONSUMER         | S3Standard    | without        | does not exist |               |
      | ListObjectsV2              | DATA_CONSUMER         | S3Standard    | without        | exists         |               |
      | ListObjectVersions         | DATA_CONSUMER         | S3Standard    | with           | exists         | with          |
      | PutObjectLockConfiguration | DATA_CONSUMER         | S3Standard    | without        | does not exist |               |
      | DeleteObjects              | DATA_CONSUMER         | S3Standard    | without        | exists         |               |
      | HeadObject                 | DATA_CONSUMER         | S3Standard    | without        | exists         |               |
      | CopyObject                 | DATA_CONSUMER         | S3Standard    | without        | exists         |               |
      | GetObjectTagging           | DATA_CONSUMER         | S3Standard    | without        | exists         |               |
      | PutObjectTagging           | DATA_CONSUMER         | S3Standard    | without        | exists         |               |
      | DeleteObjectVersion        | DATA_CONSUMER         | S3Standard    | with           | exists         | with          |
      | PutBucketLifecycle         | DATA_CONSUMER         | S3Standard    | without        | does not exist |               |
      | PutBucketReplication       | DATA_CONSUMER         | S3Standard    | with           | does not exist |               |
      | GetObjectVersion           | DATA_CONSUMER         | S3Standard    | with           | exists         | with          |
      | GetObjectVersionTagging    | DATA_CONSUMER         | S3Standard    | with           | exists         | with          |
      | DeleteObjectVersionTagging | DATA_CONSUMER         | S3Standard    | with           | exists         | with          |
      | PutObjectVersionTagging    | DATA_CONSUMER         | S3Standard    | with           | exists         | with          |
      | GetObjectVersionAcl        | DATA_CONSUMER         | S3Standard    | with           | exists         | with          |
      | PutObjectVersionAcl        | DATA_CONSUMER         | S3Standard    | with           | exists         | with          |
      | PutBucketTagging           | DATA_CONSUMER         | S3Standard    | without        | does not exist |               |
      | DeleteBucketTagging        | DATA_CONSUMER         | S3Standard    | without        | does not exist |               |


  @2.6.0
  @PreMerge
  @IAM-Policies-ARWWI
  Scenario Outline: Assume Role with Web Identity bucket setting tests
    Given an existing bucket "" "<withVersioning>" versioning
    And an object that "<objectExists>" "<withVersionId>" version-Id
    And a <type> type
    When the user tries to perform "S3Standard" "<action>" on the bucket
    Then the user should receive "<error>" error

    Examples:
      | action                           | type                  | withVersioning | objectExists   | withVersionId | error                                       |
      | RestoreObject                    | STORAGE_MANAGER       | with           | exists         | with          | InvalidObjectState                          |
      | GetBucketCors                    | STORAGE_MANAGER       | without        | does not exist |               | NoSuchCORSConfiguration                     |
      | GetBucketObjectLockConfiguration | STORAGE_MANAGER       | without        | does not exist |               | ObjectLockConfigurationNotFoundError        |
      | GetObjectRetention               | STORAGE_MANAGER       | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | GetObjectLegalHold               | STORAGE_MANAGER       | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | PutObjectRetention               | STORAGE_MANAGER       | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | PutObjectLegalHold               | STORAGE_MANAGER       | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | GetBucketReplication             | STORAGE_MANAGER       | without        | does not exist |               | ReplicationConfigurationNotFoundError       |
      | GetBucketLifecycle               | STORAGE_MANAGER       | without        | does not exist |               | NoSuchLifecycleConfiguration                |
      | GetObjectVersionRetention        | STORAGE_MANAGER       | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | GetObjectVersionLegalHold        | STORAGE_MANAGER       | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | PutObjectVersionRetention        | STORAGE_MANAGER       | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | PutObjectVersionLegalHold        | STORAGE_MANAGER       | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | GetBucketTagging                 | STORAGE_MANAGER       | without        | does not exist |               | NoSuchTagSet                                |
      | RestoreObject                    | STORAGE_ACCOUNT_OWNER | with           | exists         | with          | InvalidObjectState                          |
      | GetBucketCors                    | STORAGE_ACCOUNT_OWNER | without        | does not exist |               | NoSuchCORSConfiguration                     |
      | GetBucketObjectLockConfiguration | STORAGE_ACCOUNT_OWNER | without        | does not exist |               | ObjectLockConfigurationNotFoundError        |
      | GetObjectRetention               | STORAGE_ACCOUNT_OWNER | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | GetObjectLegalHold               | STORAGE_ACCOUNT_OWNER | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | PutObjectRetention               | STORAGE_ACCOUNT_OWNER | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | PutObjectLegalHold               | STORAGE_ACCOUNT_OWNER | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | GetBucketReplication             | STORAGE_ACCOUNT_OWNER | without        | does not exist |               | ReplicationConfigurationNotFoundError       |
      | GetBucketLifecycle               | STORAGE_ACCOUNT_OWNER | without        | does not exist |               | NoSuchLifecycleConfiguration                |
      | GetObjectVersionRetention        | STORAGE_ACCOUNT_OWNER | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | GetObjectVersionLegalHold        | STORAGE_ACCOUNT_OWNER | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | PutObjectVersionRetention        | STORAGE_ACCOUNT_OWNER | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | PutObjectVersionLegalHold        | STORAGE_ACCOUNT_OWNER | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | GetBucketTagging                 | STORAGE_ACCOUNT_OWNER | without        | does not exist |               | NoSuchTagSet                                |
      | RestoreObject                    | DATA_CONSUMER         | with           | exists         | with          | InvalidObjectState                          |
      | GetBucketCors                    | DATA_CONSUMER         | without        | does not exist |               | NoSuchCORSConfiguration                     |
      | GetBucketObjectLockConfiguration | DATA_CONSUMER         | without        | does not exist |               | ObjectLockConfigurationNotFoundError        |
      | GetObjectRetention               | DATA_CONSUMER         | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | GetObjectLegalHold               | DATA_CONSUMER         | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | PutObjectRetention               | DATA_CONSUMER         | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | PutObjectLegalHold               | DATA_CONSUMER         | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | GetBucketReplication             | DATA_CONSUMER         | without        | does not exist |               | ReplicationConfigurationNotFoundError       |
      | GetBucketLifecycle               | DATA_CONSUMER         | without        | does not exist |               | NoSuchLifecycleConfiguration                |
      | GetObjectVersionRetention        | DATA_CONSUMER         | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | GetObjectVersionLegalHold        | DATA_CONSUMER         | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | PutObjectVersionRetention        | DATA_CONSUMER         | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | PutObjectVersionLegalHold        | DATA_CONSUMER         | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | GetBucketTagging                 | DATA_CONSUMER         | without        | does not exist |               | NoSuchTagSet                                |
