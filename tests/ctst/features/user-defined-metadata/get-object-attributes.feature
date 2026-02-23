Feature: GetObjectAttributes

    @2.14.0
    @PreMerge
    @GetObjectAttributes
    Scenario: Access Denied for GetObjectAttributes without user metadata
        Given a "Non versioned" bucket
        And an object "object-no-metadata-denied" that "exists"
        And a IAM_USER type
        When the user calls GetObjectAttributes for "object-no-metadata-denied" requesting "ETag"
        Then the user should receive "AccessDenied" error

    @2.14.0
    @PreMerge
    @GetObjectAttributes
    Scenario Outline: Access Denied for GetObjectAttributes without user metadata
        Given a "Non versioned" bucket
        And an object "object-no-metadata-denied" that "exists"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "<Action>" on "arn:aws:s3:::*"
        When the user calls GetObjectAttributes for "object-no-metadata-denied" requesting "ETag"
        Then the user should receive "AccessDenied" error

        Examples:
            | Action               |
            | GetObject            |
            | GetObjectAttributes  |

    @2.14.0
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


    @2.14.0
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

    @2.14.0
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

    @2.14.0
    @PreMerge
    @GetObjectAttributes
    Scenario Outline: Access Denied for GetObjectAttributes with versioned bucket
        Given a "Non versioned" bucket
        And an object "object-versioned-denied" that "exists"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "<Permission>" on "arn:aws:s3:::*"
        When the user calls GetObjectAttributes for "object-versioned-denied" requesting "ETag"
        Then the user should receive "AccessDenied" error

        Examples:
            | Permission                 |
            | GetObjectVersion           |
            | GetObjectVersionAttributes |

    @2.14.0
    @PreMerge
    @GetObjectAttributes
    Scenario Outline: GetObjectAttributes returns expected attributes on a versioned bucket without user metadata
        Given a "Versioned" bucket
        And an object "object-no-metadata-versioned" that "exists"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObjectVersion" on "arn:aws:s3:::*"
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObjectVersionAttributes" on "arn:aws:s3:::*"
        When the user calls GetObjectAttributes for "object-no-metadata-versioned" requesting "<attributes>" with the latest version
        Then the operation finished without error

        Examples:
            | attributes      |
            | ObjectSize      |
            | ETag            |
            | ObjectSize,ETag |

    @2.14.0
    @PreMerge
    @GetObjectAttributes
    Scenario Outline: GetObjectAttributes returns expected attributes on a versioned bucket with user metadata
        Given a "Versioned" bucket
        And 1 objects "object-with-metadata-versioned" of size 100 bytes with user metadata "x-amz-meta-foo=bar"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObjectVersion" on "arn:aws:s3:::*"
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObjectVersionAttributes" on "arn:aws:s3:::*"
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "scality" "GetObjectAttributesCustom" on "arn:aws:s3:::*"
        When the user calls GetObjectAttributes for "object-with-metadata-versioned-1" requesting "<attributes>" with the latest version
        Then the operation finished without error

        Examples:
            | attributes          |
            | ETag                |
            | x-amz-meta-foo      |
            | ETag,x-amz-meta-foo |
