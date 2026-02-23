Feature: ListObjectsV2

    @2.14.0
    @PreMerge
    @ListObjectsV2
    Scenario: Access Denied for ListObjectsV2 with optional attributes and user metadata
        Given a "Non versioned" bucket
        And an object "list-object-denied" that "exists"
        And a IAM_USER type
        When the user calls ListObjectsV2 on the bucket with optional attributes "RestoreStatus"
        Then the user should receive "AccessDenied" error

    @2.14.0
    @PreMerge
    @ListObjectsV2
    Scenario: ListObjectsV2 with optional attributes succeeds without user metadata
        Given a "Non versioned" bucket
        And an object "list-object" that "exists"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "ListBucket" on "arn:aws:s3:::*"
        When the user calls ListObjectsV2 on the bucket with optional attributes "RestoreStatus"
        Then the operation finished without error

    @2.14.0
    @PreMerge
    @ListObjectsV2
    Scenario: Access Denied for ListObjectsV2 with optional attributes and user defined metadata
        Given a "Non versioned" bucket
        And 1 objects "list-object-opt-denied" of size 100 bytes with user metadata "x-amz-meta-foo=bar"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "ListBucket" on "arn:aws:s3:::*"
        When the user calls ListObjectsV2 on the bucket with optional attributes "x-amz-meta-foo"
        Then the user should receive "AccessDenied" error

    @2.14.0
    @PreMerge
    @ListObjectsV2
    Scenario: ListObjectsV2 with optional attributes succeeds with user metadata
        Given a "Non versioned" bucket
        And 1 objects "list-object-opt" of size 100 bytes with user metadata "x-amz-meta-foo=bar"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "ListBucket" on "arn:aws:s3:::*"
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "scality" "ListBucketOptionalObjectAttributes" on "arn:aws:s3:::*"
        When the user calls ListObjectsV2 on the bucket with optional attributes "x-amz-meta-foo"
        Then the operation finished without error
