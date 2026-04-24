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
        And 3 objects "list-object" of size 100 bytes
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "ListBucket" on "arn:aws:s3:::*"
        When the user calls ListObjectsV2 on the bucket with optional attributes "RestoreStatus"
        Then the operation finished without error
        And the ListObjectsV2 response should contain 3 objects
        And the ListObjectsV2 response should contain "RestoreStatus"

    @2.14.0
    @PreMerge
    @ListObjectsV2
    Scenario: Access Denied for ListObjectsV2 with optional attributes and user defined metadata
        Given a "Non versioned" bucket
        And 1 objects "list-object-opt-denied" of size 100 bytes with user metadata "foo=bar"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "ListBucket" on "arn:aws:s3:::*"
        When the user calls ListObjectsV2 on the bucket with optional attributes "x-amz-meta-foo"
        Then the user should receive "AccessDenied" error

    @2.14.0
    @PreMerge
    @ListObjectsV2
    Scenario: ListObjectsV2 with optional attributes succeeds with user metadata
        Given a "Non versioned" bucket
        And 3 objects "list-object-opt" of size 100 bytes with user metadata "foo=bar"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "ListBucket" on "arn:aws:s3:::*"
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "scality" "ListBucketOptionalObjectAttributes" on "arn:aws:s3:::*"
        When the user calls ListObjectsV2 on the bucket with optional attributes "x-amz-meta-foo"
        Then the operation finished without error
        And the ListObjectsV2 response should contain 3 objects

    @2.14.0
    @PreMerge
    @ListObjectsV2
    Scenario Outline: Access Denied for ListObjectsV2 with user metadata and partial policies
        Given a "Non versioned" bucket
        And 1 objects "list-object-partial" of size 100 bytes with user metadata "foo=bar"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "<Service>" "<Action>" on "arn:aws:s3:::*"
        When the user calls ListObjectsV2 on the bucket with optional attributes "x-amz-meta-foo"
        Then the user should receive "AccessDenied" error

        Examples:
            | Service  | Action                                |
            | scality  | ListBucketOptionalObjectAttributes    |
            | s3       | ListBucket                            |

    @2.14.0
    @PreMerge
    @ListObjectsV2
    Scenario Outline: ListObjectsV2 returns expected optional attributes
        Given a "Non versioned" bucket
        And 3 objects "list-object-values" of size 100 bytes with user metadata "foo=bar,baz=qux"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "ListBucket" on "arn:aws:s3:::*"
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "scality" "ListBucketOptionalObjectAttributes" on "arn:aws:s3:::*"
        When the user calls ListObjectsV2 on the bucket with optional attributes "<attributes>"
        Then the operation finished without error
        And the ListObjectsV2 response should contain 3 objects
        And the ListObjectsV2 response should contain "<expectedAttributes>" with values "<expectedValues>"

        Examples:
            | attributes                      | expectedAttributes              | expectedValues |
            | x-amz-meta-foo                  | x-amz-meta-foo                  | bar            |
            | x-amz-meta-baz                  | x-amz-meta-baz                  | qux            |
            | x-amz-meta-foo,x-amz-meta-baz   | x-amz-meta-foo,x-amz-meta-baz   | bar,qux        |
            | x-amz-meta-bar                  | x-amz-meta-bar                  |                |
            | x-amz-meta-nonexistent          | x-amz-meta-nonexistent          |                |
            | x-amz-meta-*                    | x-amz-meta-foo,x-amz-meta-baz   | bar,qux        |
            | RestoreStatus,x-amz-meta-foo    | x-amz-meta-foo                  | bar            |
