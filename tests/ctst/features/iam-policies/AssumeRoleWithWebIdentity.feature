Feature: Assume Role with Web Identity
    In order to interact with restricted APIs
    As an Artesca User
    I want to use a web identity
    And to succeed in accessing the API

  @2.6.0
  @PreMerge
  @IAM-Policies-ARWWI
  Scenario Outline: Assume Role with Web Identity
    Given an existing bucket "" "<withVersioning>" versioning, "without" ObjectLock "without" retention mode
    And an object "" that "<objectExists>"
    And a <type> type
    When the user tries to perform "<action>" on the bucket
    Then the user should be able to perform successfully the "<action>" action

    Examples:
      | action                          | type                  | withVersioning | objectExists   |
      | MetadataSearch                  | STORAGE_MANAGER       | without        | does not exist |
      | PutObject                       | STORAGE_MANAGER       | without        | does not exist |
      | PutObjectAcl                    | STORAGE_MANAGER       | without        | does not exist |
      | GetObject                       | STORAGE_MANAGER       | without        | exists         |
      | GetObject                       | STORAGE_MANAGER       | with           | exists         |
      | GetObjectAcl                    | STORAGE_MANAGER       | without        | exists         |
      | DeleteObject                    | STORAGE_MANAGER       | without        | exists         |
      | DeleteObject                    | STORAGE_MANAGER       | with           | exists         |
      | GetBucketVersioning             | STORAGE_MANAGER       | with           | does not exist |
      | GetBucketAcl                    | STORAGE_MANAGER       | without        | does not exist |
      | ListObjectsV2                   | STORAGE_MANAGER       | without        | exists         |
      | ListObjectVersions              | STORAGE_MANAGER       | with           | exists         |
      | DeleteObjects                   | STORAGE_MANAGER       | without        | exists         |
      | HeadObject                      | STORAGE_MANAGER       | without        | exists         |
      | CopyObject                      | STORAGE_MANAGER       | without        | exists         |
      | GetObjectTagging                | STORAGE_MANAGER       | without        | exists         |
      | GetObjectTagging                | STORAGE_MANAGER       | with           | exists         |
      | PutObjectTagging                | STORAGE_MANAGER       | without        | exists         |
      | PutBucketLifecycleConfiguration | STORAGE_MANAGER       | without        | does not exist |
      | GetObjectTagging                | STORAGE_MANAGER       | with           | exists         |
      | DeleteObjectTagging             | STORAGE_MANAGER       | with           | exists         |
      | DeleteObjectTagging             | STORAGE_MANAGER       | without        | exists         |
      | PutObjectTagging                | STORAGE_MANAGER       | without        | exists         |
      | PutObjectTagging                | STORAGE_MANAGER       | with           | exists         |
      | GetObjectAcl                    | STORAGE_MANAGER       | with           | exists         |
      | GetObjectAcl                    | STORAGE_MANAGER       | without        | exists         |
      | PutObjectAcl                    | STORAGE_MANAGER       | with           | exists         |
      | PutObjectAcl                    | STORAGE_MANAGER       | without        | exists         |
      | PutBucketTagging                | STORAGE_MANAGER       | without        | does not exist |
      | DeleteBucketTagging             | STORAGE_MANAGER       | without        | does not exist |
      | PutBucketReplication            | STORAGE_MANAGER       | with           | does not exist |
      | MetadataSearch                  | STORAGE_ACCOUNT_OWNER | without        | does not exist |
      | PutObject                       | STORAGE_ACCOUNT_OWNER | without        | does not exist |
      | PutObjectAcl                    | STORAGE_ACCOUNT_OWNER | without        | does not exist |
      | GetObject                       | STORAGE_ACCOUNT_OWNER | without        | exists         |
      | GetObject                       | STORAGE_ACCOUNT_OWNER | with           | exists         |
      | GetObjectAcl                    | STORAGE_ACCOUNT_OWNER | without        | exists         |
      | DeleteObject                    | STORAGE_ACCOUNT_OWNER | without        | exists         |
      | DeleteObject                    | STORAGE_ACCOUNT_OWNER | with           | exists         |
      | GetBucketVersioning             | STORAGE_ACCOUNT_OWNER | with           | does not exist |
      | GetBucketAcl                    | STORAGE_ACCOUNT_OWNER | without        | does not exist |
      | ListObjectsV2                   | STORAGE_ACCOUNT_OWNER | without        | exists         |
      | ListObjectVersions              | STORAGE_ACCOUNT_OWNER | with           | exists         |
      | DeleteObjects                   | STORAGE_ACCOUNT_OWNER | without        | exists         |
      | HeadObject                      | STORAGE_ACCOUNT_OWNER | without        | exists         |
      | CopyObject                      | STORAGE_ACCOUNT_OWNER | without        | exists         |
      | GetObjectTagging                | STORAGE_ACCOUNT_OWNER | without        | exists         |
      | GetObjectTagging                | STORAGE_ACCOUNT_OWNER | with           | exists         |
      | PutObjectTagging                | STORAGE_ACCOUNT_OWNER | without        | exists         |
      | PutBucketLifecycleConfiguration | STORAGE_ACCOUNT_OWNER | without        | does not exist |
      | GetObject                       | STORAGE_ACCOUNT_OWNER | with           | exists         |
      | GetObjectTagging                | STORAGE_ACCOUNT_OWNER | with           | exists         |
      | DeleteObjectTagging             | STORAGE_ACCOUNT_OWNER | with           | exists         |
      | DeleteObjectTagging             | STORAGE_ACCOUNT_OWNER | without        | exists         |
      | PutObjectTagging                | STORAGE_ACCOUNT_OWNER | without        | exists         |
      | PutObjectTagging                | STORAGE_ACCOUNT_OWNER | with           | exists         |
      | GetObjectAcl                    | STORAGE_ACCOUNT_OWNER | with           | exists         |
      | GetObjectAcl                    | STORAGE_ACCOUNT_OWNER | without        | exists         |
      | PutObjectAcl                    | STORAGE_ACCOUNT_OWNER | with           | exists         |
      | PutObjectAcl                    | STORAGE_ACCOUNT_OWNER | without        | exists         |
      | PutObjectAcl                    | STORAGE_ACCOUNT_OWNER | with           | exists         |
      | PutBucketTagging                | STORAGE_ACCOUNT_OWNER | without        | does not exist |
      | DeleteBucketTagging             | STORAGE_ACCOUNT_OWNER | without        | does not exist |
      | PutBucketReplication            | STORAGE_ACCOUNT_OWNER | with           | does not exist |
      | MetadataSearch                  | DATA_CONSUMER         | without        | does not exist |
      | PutObject                       | DATA_CONSUMER         | without        | does not exist |
      | PutObjectAcl                    | DATA_CONSUMER         | without        | does not exist |
      | GetObject                       | DATA_CONSUMER         | without        | exists         |
      | GetObject                       | DATA_CONSUMER         | with           | exists         |
      | GetObjectAcl                    | DATA_CONSUMER         | without        | exists         |
      | DeleteObject                    | DATA_CONSUMER         | without        | exists         |
      | DeleteObject                    | DATA_CONSUMER         | with           | exists         |
      | GetBucketVersioning             | DATA_CONSUMER         | with           | does not exist |
      | GetBucketAcl                    | DATA_CONSUMER         | without        | does not exist |
      | ListObjectsV2                   | DATA_CONSUMER         | without        | exists         |
      | ListObjectVersions              | DATA_CONSUMER         | with           | exists         |
      | DeleteObjects                   | DATA_CONSUMER         | without        | exists         |
      | HeadObject                      | DATA_CONSUMER         | without        | exists         |
      | CopyObject                      | DATA_CONSUMER         | without        | exists         |
      | GetObjectTagging                | DATA_CONSUMER         | without        | exists         |
      | GetObjectTagging                | DATA_CONSUMER         | with           | exists         |
      | PutObjectTagging                | DATA_CONSUMER         | without        | exists         |
      | PutBucketLifecycleConfiguration | DATA_CONSUMER         | without        | does not exist |
      | GetObject                       | DATA_CONSUMER         | with           | exists         |
      | GetObjectTagging                | DATA_CONSUMER         | with           | exists         |
      | DeleteObjectTagging             | DATA_CONSUMER         | with           | exists         |
      | DeleteObjectTagging             | DATA_CONSUMER         | without        | exists         |
      | PutObjectTagging                | DATA_CONSUMER         | without        | exists         |
      | PutObjectTagging                | DATA_CONSUMER         | with           | exists         |
      | GetObjectAcl                    | DATA_CONSUMER         | with           | exists         |
      | GetObjectAcl                    | DATA_CONSUMER         | without        | exists         |
      | PutObjectAcl                    | DATA_CONSUMER         | with           | exists         |
      | PutObjectAcl                    | DATA_CONSUMER         | without        | exists         |
      | PutBucketTagging                | DATA_CONSUMER         | without        | does not exist |
      | DeleteBucketTagging             | DATA_CONSUMER         | without        | does not exist |
      | PutBucketReplication            | DATA_CONSUMER         | with           | does not exist |


  @2.6.0
  @PreMerge
  @IAM-Policies-ARWWI
  Scenario Outline: Assume Role with Web Identity bucket setting tests
    Given an existing bucket "" "<withVersioning>" versioning, "without" ObjectLock "without" retention mode
    And an object "" that "<objectExists>"
    And a <type> type
    When the user tries to perform "<action>" on the bucket
    Then the user should receive "<error>" error

    Examples:
      | action                          | type                  | withVersioning | objectExists   | error                                       |
      | RestoreObject                   | STORAGE_MANAGER       | with           | exists         | InvalidObjectState                          |
      | GetBucketCors                   | STORAGE_MANAGER       | without        | does not exist | NoSuchCORSConfiguration                     |
      | GetObjectLockConfiguration      | STORAGE_MANAGER       | without        | does not exist | ObjectLockConfigurationNotFoundError        |
      | GetObjectRetention              | STORAGE_MANAGER       | with           | exists         | Bucket is missing Object Lock Configuration |
      | GetObjectLegalHold              | STORAGE_MANAGER       | with           | exists         | Bucket is missing Object Lock Configuration |
      | PutObjectRetention              | STORAGE_MANAGER       | with           | exists         | Bucket is missing Object Lock Configuration |
      | PutObjectLegalHold              | STORAGE_MANAGER       | with           | exists         | Bucket is missing Object Lock Configuration |
      | GetBucketReplication            | STORAGE_MANAGER       | without        | does not exist | ReplicationConfigurationNotFoundError       |
      | GetBucketLifecycleConfiguration | STORAGE_MANAGER       | without        | does not exist | NoSuchLifecycleConfiguration                |
      | GetObjectRetention              | STORAGE_MANAGER       | with           | exists         | Bucket is missing Object Lock Configuration |
      | GetObjectLegalHold              | STORAGE_MANAGER       | with           | exists         | Bucket is missing Object Lock Configuration |
      | PutObjectRetention              | STORAGE_MANAGER       | with           | exists         | Bucket is missing Object Lock Configuration |
      | PutObjectLegalHold              | STORAGE_MANAGER       | with           | exists         | Bucket is missing Object Lock Configuration |
      | GetBucketTagging                | STORAGE_MANAGER       | without        | does not exist | NoSuchTagSet                                |
      | PutObjectLockConfiguration      | STORAGE_MANAGER       | without        | does not exist | InvalidBucketState                          |
      | RestoreObject                   | STORAGE_ACCOUNT_OWNER | with           | exists         | InvalidObjectState                          |
      | GetBucketCors                   | STORAGE_ACCOUNT_OWNER | without        | does not exist | NoSuchCORSConfiguration                     |
      | GetObjectLockConfiguration      | STORAGE_ACCOUNT_OWNER | without        | does not exist | ObjectLockConfigurationNotFoundError        |
      | GetObjectRetention              | STORAGE_ACCOUNT_OWNER | with           | exists         | Bucket is missing Object Lock Configuration |
      | GetObjectLegalHold              | STORAGE_ACCOUNT_OWNER | with           | exists         | Bucket is missing Object Lock Configuration |
      | PutObjectRetention              | STORAGE_ACCOUNT_OWNER | with           | exists         | Bucket is missing Object Lock Configuration |
      | PutObjectLegalHold              | STORAGE_ACCOUNT_OWNER | with           | exists         | Bucket is missing Object Lock Configuration |
      | GetBucketReplication            | STORAGE_ACCOUNT_OWNER | without        | does not exist | ReplicationConfigurationNotFoundError       |
      | GetBucketLifecycleConfiguration | STORAGE_ACCOUNT_OWNER | without        | does not exist | NoSuchLifecycleConfiguration                |
      | GetObjectRetention              | STORAGE_ACCOUNT_OWNER | with           | exists         | Bucket is missing Object Lock Configuration |
      | GetObjectLegalHold              | STORAGE_ACCOUNT_OWNER | with           | exists         | Bucket is missing Object Lock Configuration |
      | PutObjectRetention              | STORAGE_ACCOUNT_OWNER | with           | exists         | Bucket is missing Object Lock Configuration |
      | PutObjectLegalHold              | STORAGE_ACCOUNT_OWNER | with           | exists         | Bucket is missing Object Lock Configuration |
      | GetBucketTagging                | STORAGE_ACCOUNT_OWNER | without        | does not exist | NoSuchTagSet                                |
      | PutObjectLockConfiguration      | STORAGE_ACCOUNT_OWNER | without        | does not exist | InvalidBucketState                          |
      | RestoreObject                   | DATA_CONSUMER         | with           | exists         | InvalidObjectState                          |
      | GetBucketCors                   | DATA_CONSUMER         | without        | does not exist | NoSuchCORSConfiguration                     |
      | GetObjectLockConfiguration      | DATA_CONSUMER         | without        | does not exist | ObjectLockConfigurationNotFoundError        |
      | GetObjectRetention              | DATA_CONSUMER         | with           | exists         | Bucket is missing Object Lock Configuration |
      | GetObjectLegalHold              | DATA_CONSUMER         | with           | exists         | Bucket is missing Object Lock Configuration |
      | PutObjectRetention              | DATA_CONSUMER         | with           | exists         | Bucket is missing Object Lock Configuration |
      | PutObjectLegalHold              | DATA_CONSUMER         | with           | exists         | Bucket is missing Object Lock Configuration |
      | GetBucketReplication            | DATA_CONSUMER         | without        | does not exist | ReplicationConfigurationNotFoundError       |
      | GetBucketLifecycleConfiguration | DATA_CONSUMER         | without        | does not exist | NoSuchLifecycleConfiguration                |
      | GetObjectRetention              | DATA_CONSUMER         | with           | exists         | Bucket is missing Object Lock Configuration |
      | GetObjectLegalHold              | DATA_CONSUMER         | with           | exists         | Bucket is missing Object Lock Configuration |
      | PutObjectRetention              | DATA_CONSUMER         | with           | exists         | Bucket is missing Object Lock Configuration |
      | PutObjectLegalHold              | DATA_CONSUMER         | with           | exists         | Bucket is missing Object Lock Configuration |
      | GetBucketTagging                | DATA_CONSUMER         | without        | does not exist | NoSuchTagSet                                |
      | PutObjectLockConfiguration      | DATA_CONSUMER         | without        | does not exist | InvalidBucketState                          |


  @2.6.0
  @PreMerge
  @IAM-Policies-ARWWI
  Scenario Outline: Data Consumer with Web Identity cannot perform these bucket actions
    Given an existing bucket "" "<withVersioning>" versioning, "without" ObjectLock "without" retention mode
    And an object "" that "<objectExists>"
    And a DATA_CONSUMER type
    When the user tries to perform "<action>" on the bucket
    Then the user should receive "AccessDenied" error

    Examples:
      | action              | withVersioning | objectExists   |
      | CreateBucket        | with           | does not exist |
      | DeleteBucket        | with           | does not exist |
      | PutBucketVersioning | with           | does not exist |
