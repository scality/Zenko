Feature: GetObjectAttributes

    @2.13.5
    @PreMerge
    @GetObjectAttributes
    Scenario: Access Denied for GetObjectAttributes without user metadata
        Given a "Non versioned" bucket
        And an object "object-no-metadata-denied" that "exists"
        And a IAM_USER type
        When the user calls GetObjectAttributes for "object-no-metadata-denied" requesting "ETag"
        Then the user should receive "AccessDenied" error

    @2.13.5
    @PreMerge
    @GetObjectAttributes
    Scenario: Access Denied for GetObjectAttributes without user metadata
        Given a "Non versioned" bucket
        And an object "object-no-metadata-denied" that "exists"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObject" on "arn:aws:s3:::*"
        When the user calls GetObjectAttributes for "object-no-metadata-denied" requesting "ETag"
        Then the user should receive "AccessDenied" error

    @2.13.5
    @PreMerge
    # @GetObjectAttributes
    Scenario: Access Denied for GetObjectAttributes without user metadata
        Given a "Non versioned" bucket
        And an object "object-no-metadata-denied" that "exists"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObjectAttributes" on "arn:aws:s3:::*"
        When the user calls GetObjectAttributes for "object-no-metadata-denied" requesting "ETag"
        Then the user should receive "AccessDenied" error

    @2.13.5
    @PreMerge
    @GetObjectAttributes
    Scenario Outline: GetObjectAttributes returns expected attributes for an object without user metadata
        Given a "Non versioned" bucket
        And an object "object-no-metadata" that "exists"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObject" on "arn:aws:s3:::*"
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObjectAttributes" on "arn:aws:s3:::*"
        When the user calls GetObjectAttributes for "object-no-metadata" requesting "<attributes>"
        Then the operation finished without error

        Examples:
            | attributes      |
            | ObjectSize      |
            | ETag            |
            | ObjectSize,ETag |


    @2.13.5
    @PreMerge
    @GetObjectAttributes
    Scenario: Access Denied for GetObjectAttributes with user metadata
        Given a "Non versioned" bucket
        And 1 objects "object-with-metadata-denied" of size 100 bytes with user metadata "x-amz-meta-custom=value123"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObject" on "arn:aws:s3:::*"
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObjectAttributes" on "arn:aws:s3:::*"
        When the user calls GetObjectAttributes for "object-with-metadata-denied-1" requesting "x-amz-meta-custom"
        Then the user should receive "AccessDenied" error

    @2.13.5
    @PreMerge
    @GetObjectAttributes
    Scenario Outline: GetObjectAttributes returns expected attributes for an object with user metadata
        Given a "Non versioned" bucket
        And 1 objects "object-with-metadata" of size 100 bytes with user metadata "x-amz-meta-foo=bar"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObject" on "arn:aws:s3:::*"
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObjectAttributes" on "arn:aws:s3:::*"
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "scality" "GetObjectAttributesCustom" on "arn:aws:s3:::*"
        When the user calls GetObjectAttributes for "object-with-metadata-1" requesting "<attributes>"
        Then the operation finished without error

        Examples:
            | attributes          |
            | ETag                |
            | x-amz-meta-foo      |
            | x-amz-meta-bar      |
            | ETag,x-amz-meta-foo |

# TODO: Others tests
# - Right for versioned
