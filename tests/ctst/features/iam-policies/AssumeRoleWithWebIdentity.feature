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
    Given an existing bucket "<bucketName>" "<withVersioning>" versioning
    And we "<haveObject>" an existing object "<objectName>" "<withVersionId>" version-Id "<objectVersionId>"
    And a <type> type
    When the user tries to perform "<ifS3Standard>" "<action>" on the bucket
    Then the user should be able to perform successfully

    Examples:
      | action                           | type            | ifS3Standard  | bucketName | withVersioning | haveObject  | objectName | withVersionId | objectVersionId |
      | MetadataSearch                   | STORAGE_MANAGER | notS3Standard | myBucket   | without        | do not have | myObject   | without       |                 |
      | RestoreObject                    | STORAGE_MANAGER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObject                        | STORAGE_MANAGER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | PutObjectAcl                     | STORAGE_MANAGER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | GetObject                        | STORAGE_MANAGER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | GetObjectAcl                     | STORAGE_MANAGER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | DeleteObject                     | STORAGE_MANAGER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | GetBucketVersioning              | STORAGE_MANAGER | S3Standard    | myBucket   | with           | do not have |            |               |                 |
      | GetBucketCors                    | STORAGE_MANAGER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | GetBucketAcl                     | STORAGE_MANAGER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | GetBucketObjectLockConfiguration | STORAGE_MANAGER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | ListObjectsV2                    | STORAGE_MANAGER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | ListObjectVersions               | STORAGE_MANAGER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectLockConfiguration       | STORAGE_MANAGER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | DeleteObjects                    | STORAGE_MANAGER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | GetObjectRetention               | STORAGE_MANAGER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetObjectLegalHold               | STORAGE_MANAGER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectRetention               | STORAGE_MANAGER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectLegalHold               | STORAGE_MANAGER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | HeadObject                       | STORAGE_MANAGER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | CopyObject                       | STORAGE_MANAGER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | GetObjectTagging                 | STORAGE_MANAGER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | PutObjectTagging                 | STORAGE_MANAGER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | DeleteObjectVersion              | STORAGE_MANAGER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetBucketReplication             | STORAGE_MANAGER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | GetBucketLifecycle               | STORAGE_MANAGER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | PutBucketLifecycle               | STORAGE_MANAGER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | PutBucketReplication             | STORAGE_MANAGER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | GetObjectVersion                 | STORAGE_MANAGER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetObjectVersionRetention        | STORAGE_MANAGER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectVersionRetention        | STORAGE_MANAGER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetObjectVersionLegalHold        | STORAGE_MANAGER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectVersionLegalHold        | STORAGE_MANAGER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetObjectVersionTagging          | STORAGE_MANAGER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | DeleteObjectVersionTagging       | STORAGE_MANAGER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectVersionTagging          | STORAGE_MANAGER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetObjectVersionAcl              | STORAGE_MANAGER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectVersionAcl              | STORAGE_MANAGER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetBucketTagging                 | STORAGE_MANAGER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | PutBucketTagging                 | STORAGE_MANAGER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | DeleteBucketTagging              | STORAGE_MANAGER | S3Standard    | myBucket   | without        | do not have |            |               |                 |

      | MetadataSearch                   | STORAGE_ACCOUNT_OWNER | notS3Standard | myBucket   | without        | do not have | myObject   | without       |                 |
      | RestoreObject                    | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObject                        | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | PutObjectAcl                     | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | GetObject                        | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | GetObjectAcl                     | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | DeleteObject                     | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | GetBucketVersioning              | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | do not have |            |               |                 |
      | GetBucketCors                    | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | GetBucketAcl                     | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | GetBucketObjectLockConfiguration | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | ListObjectsV2                    | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | ListObjectVersions               | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectLockConfiguration       | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | DeleteObjects                    | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | GetObjectRetention               | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetObjectLegalHold               | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectRetention               | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectLegalHold               | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | HeadObject                       | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | CopyObject                       | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | GetObjectTagging                 | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | PutObjectTagging                 | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | DeleteObjectVersion              | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetBucketReplication             | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | GetBucketLifecycle               | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | PutBucketLifecycle               | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | PutBucketReplication             | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | GetObjectVersion                 | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetObjectVersionRetention        | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectVersionRetention        | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetObjectVersionLegalHold        | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectVersionLegalHold        | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetObjectVersionTagging          | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | DeleteObjectVersionTagging       | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectVersionTagging          | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetObjectVersionAcl              | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectVersionAcl              | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetBucketTagging                 | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | PutBucketTagging                 | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | DeleteBucketTagging              | STORAGE_ACCOUNT_OWNER | S3Standard    | myBucket   | without        | do not have |            |               |                 |

      | MetadataSearch                   | DATA_CONSUMER | notS3Standard | myBucket   | without        | do not have | myObject   | without       |                 |
      | RestoreObject                    | DATA_CONSUMER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObject                        | DATA_CONSUMER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | PutObjectAcl                     | DATA_CONSUMER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | GetObject                        | DATA_CONSUMER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | GetObjectAcl                     | DATA_CONSUMER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | DeleteObject                     | DATA_CONSUMER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | GetBucketVersioning              | DATA_CONSUMER | S3Standard    | myBucket   | with           | do not have |            |               |                 |
      | GetBucketCors                    | DATA_CONSUMER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | GetBucketAcl                     | DATA_CONSUMER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | GetBucketObjectLockConfiguration | DATA_CONSUMER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | ListObjectsV2                    | DATA_CONSUMER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | ListObjectVersions               | DATA_CONSUMER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectLockConfiguration       | DATA_CONSUMER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | DeleteObjects                    | DATA_CONSUMER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | GetObjectRetention               | DATA_CONSUMER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetObjectLegalHold               | DATA_CONSUMER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectRetention               | DATA_CONSUMER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectLegalHold               | DATA_CONSUMER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | HeadObject                       | DATA_CONSUMER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | CopyObject                       | DATA_CONSUMER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | GetObjectTagging                 | DATA_CONSUMER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | PutObjectTagging                 | DATA_CONSUMER | S3Standard    | myBucket   | without        | have        | myObject   |               |                 |
      | DeleteObjectVersion              | DATA_CONSUMER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetBucketReplication             | DATA_CONSUMER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | GetBucketLifecycle               | DATA_CONSUMER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | PutBucketLifecycle               | DATA_CONSUMER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | PutBucketReplication             | DATA_CONSUMER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | GetObjectVersion                 | DATA_CONSUMER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetObjectVersionRetention        | DATA_CONSUMER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectVersionRetention        | DATA_CONSUMER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetObjectVersionLegalHold        | DATA_CONSUMER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectVersionLegalHold        | DATA_CONSUMER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetObjectVersionTagging          | DATA_CONSUMER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | DeleteObjectVersionTagging       | DATA_CONSUMER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectVersionTagging          | DATA_CONSUMER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetObjectVersionAcl              | DATA_CONSUMER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | PutObjectVersionAcl              | DATA_CONSUMER | S3Standard    | myBucket   | with           | have        | myObject   | with          | 1               |
      | GetBucketTagging                 | DATA_CONSUMER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | PutBucketTagging                 | DATA_CONSUMER | S3Standard    | myBucket   | without        | do not have |            |               |                 |
      | DeleteBucketTagging              | DATA_CONSUMER | S3Standard    | myBucket   | without        | do not have |            |               |                 |

# | MetadataSearch                   | STORAGE_ACCOUNT_OWNER | Non versioned |
# | RestoreObject                    | STORAGE_ACCOUNT_OWNER | Non versioned |
# | PutObject                        | STORAGE_ACCOUNT_OWNER | Non versioned |
# | PutObjectAcl                     | STORAGE_ACCOUNT_OWNER | Non versioned |
# | GetObject                        | STORAGE_ACCOUNT_OWNER | Non versioned |
# | GetObjectAcl                     | STORAGE_ACCOUNT_OWNER | Non versioned |
# | DeleteObject                     | STORAGE_ACCOUNT_OWNER | Non versioned |
# | GetBucketVersioning              | STORAGE_ACCOUNT_OWNER | Non versioned |
# | GetBucketCors                    | STORAGE_ACCOUNT_OWNER | Non versioned |
# | GetBucketAcl                     | STORAGE_ACCOUNT_OWNER | Non versioned |
# | GetBucketObjectLockConfiguration | STORAGE_ACCOUNT_OWNER | Non versioned |
# | ListObjectsV2                    | STORAGE_ACCOUNT_OWNER | Non versioned |
# | ListObjectVersions               | STORAGE_ACCOUNT_OWNER | Non versioned |
# | PutObjectLockConfiguration       | STORAGE_ACCOUNT_OWNER | Non versioned |
# | DeleteObjects                    | STORAGE_ACCOUNT_OWNER | Non versioned |
# | GetObjectRetention               | STORAGE_ACCOUNT_OWNER | Non versioned |
# | GetObjectLegalHold               | STORAGE_ACCOUNT_OWNER | Non versioned |
# | PutObjectRetention               | STORAGE_ACCOUNT_OWNER | Non versioned |
# | PutObjectLegalHold               | STORAGE_ACCOUNT_OWNER | Non versioned |
# | HeadObject                       | STORAGE_ACCOUNT_OWNER | Non versioned |
# | CopyObject                       | STORAGE_ACCOUNT_OWNER | Non versioned |
# | GetObjectTagging                 | STORAGE_ACCOUNT_OWNER | Non versioned |
# | PutObjectTagging                 | STORAGE_ACCOUNT_OWNER | Non versioned |
# | DeleteObjectVersion              | STORAGE_ACCOUNT_OWNER | Non versioned |
# | GetBucketReplication             | STORAGE_ACCOUNT_OWNER | Non versioned |
# | GetBucketLifecycle               | STORAGE_ACCOUNT_OWNER | Non versioned |
# | PutBucketLifecycle               | STORAGE_ACCOUNT_OWNER | Non versioned |
# | PutBucketReplication             | STORAGE_ACCOUNT_OWNER | Non versioned |
# | GetObjectVersion                 | STORAGE_ACCOUNT_OWNER | Non versioned |
# | GetObjectVersionRetention        | STORAGE_ACCOUNT_OWNER | Non versioned |
# | PutObjectVersionRetention        | STORAGE_ACCOUNT_OWNER | Non versioned |
# | GetObjectVersionLegalHold        | STORAGE_ACCOUNT_OWNER | Non versioned |
# | PutObjectVersionLegalHold        | STORAGE_ACCOUNT_OWNER | Non versioned |
# | GetObjectVersionTagging          | STORAGE_ACCOUNT_OWNER | Non versioned |
# | DeleteObjectVersionTagging       | STORAGE_ACCOUNT_OWNER | Non versioned |
# | PutObjectVersionTagging          | STORAGE_ACCOUNT_OWNER | Non versioned |
# | GetObjectVersionAcl              | STORAGE_ACCOUNT_OWNER | Non versioned |
# | PutObjectVersionAcl              | STORAGE_ACCOUNT_OWNER | Non versioned |
# | GetBucketTagging                 | STORAGE_ACCOUNT_OWNER | Non versioned |
# | PutBucketTagging                 | STORAGE_ACCOUNT_OWNER | Non versioned |
# | DeleteBucketTagging              | STORAGE_ACCOUNT_OWNER | Non versioned |
# | MetadataSearch                   | DATA_CONSUMER         | Non versioned |
# | RestoreObject                    | DATA_CONSUMER         | Non versioned |
# | PutObject                        | DATA_CONSUMER         | Non versioned |
# | PutObjectAcl                     | DATA_CONSUMER         | Non versioned |
# | GetObject                        | DATA_CONSUMER         | Non versioned |
# | GetObjectAcl                     | DATA_CONSUMER         | Non versioned |
# | DeleteObject                     | DATA_CONSUMER         | Non versioned |
# | GetBucketVersioning              | DATA_CONSUMER         | Non versioned |
# | GetBucketCors                    | DATA_CONSUMER         | Non versioned |
# | GetBucketAcl                     | DATA_CONSUMER         | Non versioned |
# | GetBucketObjectLockConfiguration | DATA_CONSUMER         | Non versioned |
# | ListObjectsV2                    | DATA_CONSUMER         | Non versioned |
# | ListObjectVersions               | DATA_CONSUMER         | Non versioned |
# | PutObjectLockConfiguration       | DATA_CONSUMER         | Non versioned |
# | DeleteObjects                    | DATA_CONSUMER         | Non versioned |
# | GetObjectRetention               | DATA_CONSUMER         | Non versioned |
# | GetObjectLegalHold               | DATA_CONSUMER         | Non versioned |
# | PutObjectRetention               | DATA_CONSUMER         | Non versioned |
# | PutObjectLegalHold               | DATA_CONSUMER         | Non versioned |
# | HeadObject                       | DATA_CONSUMER         | Non versioned |
# | CopyObject                       | DATA_CONSUMER         | Non versioned |
# | GetObjectTagging                 | DATA_CONSUMER         | Non versioned |
# | PutObjectTagging                 | DATA_CONSUMER         | Non versioned |
# | DeleteObjectVersion              | DATA_CONSUMER         | Non versioned |
# | GetBucketReplication             | DATA_CONSUMER         | Non versioned |
# | GetBucketLifecycle               | DATA_CONSUMER         | Non versioned |
# | PutBucketLifecycle               | DATA_CONSUMER         | Non versioned |
# | PutBucketReplication             | DATA_CONSUMER         | Non versioned |
# | GetObjectVersion                 | DATA_CONSUMER         | Non versioned |
# | GetObjectVersionRetention        | DATA_CONSUMER         | Non versioned |
# | PutObjectVersionRetention        | DATA_CONSUMER         | Non versioned |
# | GetObjectVersionLegalHold        | DATA_CONSUMER         | Non versioned |
# | PutObjectVersionLegalHold        | DATA_CONSUMER         | Non versioned |
# | GetObjectVersionTagging          | DATA_CONSUMER         | Non versioned |
# | DeleteObjectVersionTagging       | DATA_CONSUMER         | Non versioned |
# | PutObjectVersionTagging          | DATA_CONSUMER         | Non versioned |
# | GetObjectVersionAcl              | DATA_CONSUMER         | Non versioned |
# | PutObjectVersionAcl              | DATA_CONSUMER         | Non versioned |
# | GetBucketTagging                 | DATA_CONSUMER         | Non versioned |
# | PutBucketTagging                 | DATA_CONSUMER         | Non versioned |
# | DeleteBucketTagging              | DATA_CONSUMER         | Non versioned |