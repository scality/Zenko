Feature: Server Side Encryption

    @2.14.0
    @PreMerge
    @ServerSideEncryption
    @ServerSideEncryptionFileBackend
    Scenario Outline: should encrypt object when bucket encryption is <bucketAlgo> and object encryption is <objectAlgo>
        Given a "Non versioned" bucket
        And bucket encryption is set to "<bucketAlgo>" with key "<bucketKeyId>"
        Then the bucket encryption is verified for algorithm "<bucketAlgo>" and key "<bucketKeyId>"
        When an object "<objectName>" is uploaded with SSE algorithm "<objectAlgo>" and key "<objectKeyId>"
        Then the PutObject response should have SSE algorithm "<expectedAlgo>" and KMS key "<expectedKeyId>"
        Then the GetObject should return the uploaded body with SSE algorithm "<expectedAlgo>" and KMS key "<expectedKeyId>"

        Examples: No bucket encryption
            | objectName     | bucketAlgo | bucketKeyId | objectAlgo | objectKeyId  | expectedAlgo | expectedKeyId |
            | no-enc-none    |            |             |            |              |              | absent        |
            | no-enc-aes     |            |             | AES256     |              | AES256       | absent        |
            | no-enc-kms     |            |             | aws:kms    |              | aws:kms      | generated     |
            | no-enc-kms-key |            |             | aws:kms    | custom-key-1 | aws:kms      | custom-key-1  |

        Examples: Bucket AES256
            | objectName      | bucketAlgo | bucketKeyId | objectAlgo | objectKeyId  | expectedAlgo | expectedKeyId |
            | bkt-aes-none    | AES256     |             |            |              | AES256       | absent        |
            | bkt-aes-aes     | AES256     |             | AES256     |              | AES256       | absent        |
            | bkt-aes-kms     | AES256     |             | aws:kms    |              | aws:kms      | generated     |
            | bkt-aes-kms-key | AES256     |             | aws:kms    | custom-key-1 | aws:kms      | custom-key-1  |

        Examples: Bucket aws:kms (default key)
            | objectName      | bucketAlgo | bucketKeyId | objectAlgo | objectKeyId  | expectedAlgo | expectedKeyId |
            | bkt-kms-none    | aws:kms    |             |            |              | aws:kms      | generated     |
            | bkt-kms-aes     | aws:kms    |             | AES256     |              | AES256       | absent        |
            | bkt-kms-kms     | aws:kms    |             | aws:kms    |              | aws:kms      | generated     |
            | bkt-kms-kms-key | aws:kms    |             | aws:kms    | custom-key-1 | aws:kms      | custom-key-1  |

        Examples: Bucket aws:kms with custom key
            | objectName         | bucketAlgo | bucketKeyId | objectAlgo | objectKeyId  | expectedAlgo | expectedKeyId |
            | bkt-kmskey-none    | aws:kms    | bucket-key  |            |              | aws:kms      | bucket-key    |
            | bkt-kmskey-aes     | aws:kms    | bucket-key  | AES256     |              | AES256       | absent        |
            | bkt-kmskey-kms     | aws:kms    | bucket-key  | aws:kms    |              | aws:kms      | bucket-key    |
            | bkt-kmskey-kms-key | aws:kms    | bucket-key  | aws:kms    | custom-key-2 | aws:kms      | custom-key-2  |

    @2.14.0
    @PreMerge
    @ServerSideEncryption
    @ServerSideEncryptionFileBackend
    Scenario: DeleteBucketEncryption removes default encryption
        Given a "Non versioned" bucket
        And bucket encryption is set to "AES256" with key ""
        When an object "enc-obj" is uploaded with SSE algorithm "" and key ""
        Then the GetObject should return the uploaded body with SSE algorithm "AES256" and KMS key "absent"
        When the user deletes bucket encryption
        Then the GetObject should return the uploaded body with SSE algorithm "AES256" and KMS key "absent"
        When an object "plain-obj" is uploaded with SSE algorithm "" and key ""
        Then the GetObject should return the uploaded body with SSE algorithm "" and KMS key "absent"

    @2.14.0
    @PreMerge
    @ServerSideEncryption
    @ServerSideEncryptionFileBackend
    Scenario Outline: PutObject with invalid SSE parameters returns an error: <objectName>
        Given a "Non versioned" bucket
        When an object "<objectName>" is uploaded with SSE algorithm "<algo>" and key "<keyId>"
        Then it should fail with error "InvalidArgument"

        Examples:
            | objectName       | algo         | keyId    |
            | sse-invalid-algo | INVALID_ALGO |          |
            | sse-aes-kms-err  | AES256       | some-key |

    @2.14.0
    @PreMerge
    @ServerSideEncryption
    @ServerSideEncryptionFileBackend
    Scenario: PutBucketEncryption AES256 with KMS key returns an error
        Given a "Non versioned" bucket
        When bucket encryption is set to "AES256" with key "some-key"
        Then it should fail with error "InvalidArgument"

    @2.14.0
    @PreMerge
    @ServerSideEncryption
    @ServerSideEncryptionFileBackend
    Scenario: GetBucketEncryption on non-encrypted bucket returns an error
        Given a "Non versioned" bucket
        When the user gets bucket encryption
        Then it should fail with error "ServerSideEncryptionConfigurationNotFoundError"
