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
      | action                     | type            | ifS3Standard  | withVersioning | objectExists   | withVersionId |
      | MetadataSearch             | STORAGE_MANAGER | notS3Standard | without        | does not exist |               |
      | PutObject                  | STORAGE_MANAGER | S3Standard    | without        | does not exist |               |
      | PutObjectAcl               | STORAGE_MANAGER | S3Standard    | without        | does not exist |               |
      | GetObject                  | STORAGE_MANAGER | S3Standard    | without        | exists         |               |
      | GetObjectAcl               | STORAGE_MANAGER | S3Standard    | without        | exists         |               |
      | DeleteObject               | STORAGE_MANAGER | S3Standard    | without        | exists         |               |
      | GetBucketVersioning        | STORAGE_MANAGER | S3Standard    | with           | does not exist |               |
      | GetBucketAcl               | STORAGE_MANAGER | S3Standard    | without        | does not exist |               |
      | ListObjectsV2              | STORAGE_MANAGER | S3Standard    | without        | exists         |               |
      | ListObjectVersions         | STORAGE_MANAGER | S3Standard    | with           | exists         | with          |
      | PutObjectLockConfiguration | STORAGE_MANAGER | S3Standard    | without        | does not exist |               |
      | DeleteObjects              | STORAGE_MANAGER | S3Standard    | without        | exists         |               |
      | HeadObject                 | STORAGE_MANAGER | S3Standard    | without        | exists         |               |
      | CopyObject                 | STORAGE_MANAGER | S3Standard    | without        | exists         |               |
      | GetObjectTagging           | STORAGE_MANAGER | S3Standard    | without        | exists         |               |
      | PutObjectTagging           | STORAGE_MANAGER | S3Standard    | without        | exists         |               |
      | DeleteObjectVersion        | STORAGE_MANAGER | S3Standard    | with           | exists         | with          |
      | PutBucketLifecycle         | STORAGE_MANAGER | S3Standard    | without        | does not exist |               |
      | PutBucketReplication       | STORAGE_MANAGER | S3Standard    | with           | does not exist |               |
      | GetObjectVersion           | STORAGE_MANAGER | S3Standard    | with           | exists         | with          |
      | GetObjectVersionTagging    | STORAGE_MANAGER | S3Standard    | with           | exists         | with          |
      | DeleteObjectVersionTagging | STORAGE_MANAGER | S3Standard    | with           | exists         | with          |
      | PutObjectVersionTagging    | STORAGE_MANAGER | S3Standard    | with           | exists         | with          |
      | GetObjectVersionAcl        | STORAGE_MANAGER | S3Standard    | with           | exists         | with          |
      | PutObjectVersionAcl        | STORAGE_MANAGER | S3Standard    | with           | exists         | with          |
      | PutBucketTagging           | STORAGE_MANAGER | S3Standard    | without        | does not exist |               |
      | DeleteBucketTagging        | STORAGE_MANAGER | S3Standard    | without        | does not exist |               |


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
      | action                           | type            | withVersioning | objectExists   | withVersionId | error                                       |
      | RestoreObject                    | STORAGE_MANAGER | with           | exists         | with          | InvalidObjectState                          |
      | GetBucketCors                    | STORAGE_MANAGER | without        | does not exist |               | NoSuchCORSConfiguration                     |
      | GetBucketObjectLockConfiguration | STORAGE_MANAGER | without        | does not exist |               | ObjectLockConfigurationNotFoundError        |
      | GetObjectRetention               | STORAGE_MANAGER | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | GetObjectLegalHold               | STORAGE_MANAGER | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | PutObjectRetention               | STORAGE_MANAGER | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | PutObjectLegalHold               | STORAGE_MANAGER | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | GetBucketReplication             | STORAGE_MANAGER | without        | does not exist |               | ReplicationConfigurationNotFoundError       |
      | GetBucketLifecycle               | STORAGE_MANAGER | without        | does not exist |               | NoSuchLifecycleConfiguration                |
      | GetObjectVersionRetention        | STORAGE_MANAGER | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | GetObjectVersionLegalHold        | STORAGE_MANAGER | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | PutObjectVersionRetention        | STORAGE_MANAGER | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | PutObjectVersionLegalHold        | STORAGE_MANAGER | with           | exists         | with          | Bucket is missing Object Lock Configuration |
      | GetBucketTagging                 | STORAGE_MANAGER | without        | does not exist |               | NoSuchTagSet                                |

# # | MetadataSearch                   | STORAGE_ACCOUNT_OWNER | notS3Standard | my-bucket   | without        | does not exist |    |        |                 |
# # | RestoreObject                    | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | PutObject                        | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | PutObjectAcl                     | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | GetObject                        | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | GetObjectAcl                     | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | DeleteObject                     | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | GetBucketVersioning              | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | does not exist |            |               |                 |
# # | GetBucketCors                    | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | GetBucketAcl                     | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | GetBucketObjectLockConfiguration | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | ListObjectsV2                    | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | ListObjectVersions               | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | PutObjectLockConfiguration       | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | DeleteObjects                    | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | GetObjectRetention               | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | GetObjectLegalHold               | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | PutObjectRetention               | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | PutObjectLegalHold               | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | HeadObject                       | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | CopyObject                       | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | GetObjectTagging                 | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | PutObjectTagging                 | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | DeleteObjectVersion              | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | GetBucketReplication             | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | GetBucketLifecycle               | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | PutBucketLifecycle               | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | PutBucketReplication             | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | GetObjectVersion                 | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | GetObjectVersionRetention        | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | PutObjectVersionRetention        | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | GetObjectVersionLegalHold        | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | PutObjectVersionLegalHold        | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | GetObjectVersionTagging          | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | DeleteObjectVersionTagging       | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | PutObjectVersionTagging          | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | GetObjectVersionAcl              | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | PutObjectVersionAcl              | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | GetBucketTagging                 | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | PutBucketTagging                 | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | DeleteBucketTagging              | STORAGE_ACCOUNT_OWNER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |

# # | MetadataSearch                   | DATA_CONSUMER | notS3Standard | my-bucket   | without        | does not exist |    |        |                 |
# # | RestoreObject                    | DATA_CONSUMER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | PutObject                        | DATA_CONSUMER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | PutObjectAcl                     | DATA_CONSUMER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | GetObject                        | DATA_CONSUMER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | GetObjectAcl                     | DATA_CONSUMER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | DeleteObject                     | DATA_CONSUMER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | GetBucketVersioning              | DATA_CONSUMER | S3Standard    | my-bucket   | with           | does not exist |            |               |                 |
# # | GetBucketCors                    | DATA_CONSUMER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | GetBucketAcl                     | DATA_CONSUMER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | GetBucketObjectLockConfiguration | DATA_CONSUMER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | ListObjectsV2                    | DATA_CONSUMER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | ListObjectVersions               | DATA_CONSUMER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | PutObjectLockConfiguration       | DATA_CONSUMER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | DeleteObjects                    | DATA_CONSUMER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | GetObjectRetention               | DATA_CONSUMER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | GetObjectLegalHold               | DATA_CONSUMER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | PutObjectRetention               | DATA_CONSUMER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | PutObjectLegalHold               | DATA_CONSUMER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | HeadObject                       | DATA_CONSUMER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | CopyObject                       | DATA_CONSUMER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | GetObjectTagging                 | DATA_CONSUMER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | PutObjectTagging                 | DATA_CONSUMER | S3Standard    | my-bucket   | without        | exists        | myObject   |               |                 |
# # | DeleteObjectVersion              | DATA_CONSUMER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | GetBucketReplication             | DATA_CONSUMER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | GetBucketLifecycle               | DATA_CONSUMER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | PutBucketLifecycle               | DATA_CONSUMER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | PutBucketReplication             | DATA_CONSUMER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | GetObjectVersion                 | DATA_CONSUMER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | GetObjectVersionRetention        | DATA_CONSUMER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | PutObjectVersionRetention        | DATA_CONSUMER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | GetObjectVersionLegalHold        | DATA_CONSUMER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | PutObjectVersionLegalHold        | DATA_CONSUMER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | GetObjectVersionTagging          | DATA_CONSUMER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | DeleteObjectVersionTagging       | DATA_CONSUMER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | PutObjectVersionTagging          | DATA_CONSUMER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | GetObjectVersionAcl              | DATA_CONSUMER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | PutObjectVersionAcl              | DATA_CONSUMER | S3Standard    | my-bucket   | with           | exists        | myObject   | with          | 1               |
# # | GetBucketTagging                 | DATA_CONSUMER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | PutBucketTagging                 | DATA_CONSUMER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
# # | DeleteBucketTagging              | DATA_CONSUMER | S3Standard    | my-bucket   | without        | does not exist |            |               |                 |
