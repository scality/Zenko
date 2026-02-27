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
            | Action              |
            | GetObject           |
            | GetObjectAttributes |

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
        And the GetObjectAttributes response should contain "<expectedAttributes>" with values "<expectedValues>"

        Examples:
            | attributes                   | expectedAttributes           | expectedValues         |
            | ObjectSize                   | ObjectSize                   | 0                      |
            | StorageClass                 | StorageClass                 | STANDARD               |
            | ETag                         | ETag                         | {savedETag}            |
            | ObjectSize,StorageClass,ETag | ObjectSize,StorageClass,ETag | 0,STANDARD,{savedETag} |

    @2.14.0
    @PreMerge
    @GetObjectAttributes
    Scenario: Access Denied for GetObjectAttributes with user metadata
        Given a "Non versioned" bucket
        And 1 objects "object-with-metadata-denied" of size 100 bytes with user metadata "foo=bar"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObject" on "arn:aws:s3:::*"
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObjectAttributes" on "arn:aws:s3:::*"
        When the user calls GetObjectAttributes for "object-with-metadata-denied-1" requesting "x-amz-meta-foo"
        Then the user should receive "AccessDenied" error

    @2.14.0
    @PreMerge
    @GetObjectAttributes
    Scenario Outline: Access Denied for GetObjectAttributes with user metadata and partial policies
        Given a "Non versioned" bucket
        And 1 objects "object-with-metadata-partial" of size 100 bytes with user metadata "foo=bar"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "<Service>" "<Action>" on "arn:aws:s3:::*"
        When the user calls GetObjectAttributes for "object-with-metadata-partial-1" requesting "x-amz-meta-foo"
        Then the user should receive "AccessDenied" error

        Examples:
            | Service  | Action                    |
            | scality  | GetObjectAttributesCustom |
            | s3       | GetObject                 |
            | s3       | GetObjectAttributes       |

    @2.14.0
    @PreMerge
    @GetObjectAttributes
    Scenario Outline: GetObjectAttributes returns expected attributes for an object with user metadata
        Given a "Non versioned" bucket
        And 1 objects "object-with-metadata" of size 100 bytes with user metadata "foo=bar,baz=qux"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObject" on "arn:aws:s3:::*"
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObjectAttributes" on "arn:aws:s3:::*"
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "scality" "GetObjectAttributesCustom" on "arn:aws:s3:::*"
        When the user calls GetObjectAttributes for "object-with-metadata-1" requesting "<attributes>"
        Then the operation finished without error
        And the GetObjectAttributes response should contain "<expectedAttributes>" with values "<expectedValues>"

        Examples:
            | attributes                    | expectedAttributes            | expectedValues           |
            | ObjectSize                    | ObjectSize                    | 100                      |
            | StorageClass                  | StorageClass                  | STANDARD                 |
            | ETag                          | ETag                          | {savedETag}              |
            | ObjectSize,StorageClass,ETag  | ObjectSize,StorageClass,ETag  | 100,STANDARD,{savedETag} |
            | x-amz-meta-foo                | x-amz-meta-foo                | bar                      |
            | x-amz-meta-baz                | x-amz-meta-baz                | qux                      |
            | x-amz-meta-foo,x-amz-meta-baz | x-amz-meta-foo,x-amz-meta-baz | bar,qux                  |
            | ETag,x-amz-meta-bar           | ETag,x-amz-meta-bar           | {savedETag},             |
            | ETag,x-amz-meta-foo           | ETag,x-amz-meta-foo           | {savedETag},bar          |
            | x-amz-meta-bar                | x-amz-meta-bar                |                          |
            | x-amz-meta-nonexistent        | x-amz-meta-nonexistent        |                          |
            | x-amz-meta-*                  | x-amz-meta-foo,x-amz-meta-baz | bar,qux                  |

    @2.14.0
    @PreMerge
    @GetObjectAttributes
    Scenario: GetObjectAttributes for a non-existent object
        Given a "Non versioned" bucket
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObject" on "arn:aws:s3:::*"
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObjectAttributes" on "arn:aws:s3:::*"
        When the user calls GetObjectAttributes for "non-existent-object" requesting "ETag"
        Then the user should receive "NoSuchKey" error

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
        And the GetObjectAttributes response should contain "<expectedAttributes>" with values "<expectedValues>"

        Examples:
            | attributes                   | expectedAttributes           | expectedValues         |
            | ObjectSize                   | ObjectSize                   | 0                      |
            | StorageClass                 | StorageClass                 | STANDARD               |
            | ETag                         | ETag                         | {savedETag}            |
            | ObjectSize,StorageClass,ETag | ObjectSize,StorageClass,ETag | 0,STANDARD,{savedETag} |

    @2.14.0
    @PreMerge
    @GetObjectAttributes
    Scenario: Access Denied for GetObjectAttributes on versioned bucket with user metadata
        Given a "Versioned" bucket
        And 1 objects "object-with-metadata-versioned-denied" of size 100 bytes with user metadata "foo=bar"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObjectVersion" on "arn:aws:s3:::*"
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObjectVersionAttributes" on "arn:aws:s3:::*"
        When the user calls GetObjectAttributes for "object-with-metadata-versioned-denied-1" requesting "x-amz-meta-foo" with the latest version
        Then the user should receive "AccessDenied" error

    @2.14.0
    @PreMerge
    @GetObjectAttributes
    Scenario Outline: GetObjectAttributes returns expected attributes on a versioned bucket with user metadata
        Given a "Versioned" bucket
        And 1 objects "object-with-metadata-versioned" of size 100 bytes with user metadata "foo=bar,baz=qux"
        And a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObjectVersion" on "arn:aws:s3:::*"
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "s3" "GetObjectVersionAttributes" on "arn:aws:s3:::*"
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "scality" "GetObjectAttributesCustom" on "arn:aws:s3:::*"
        When the user calls GetObjectAttributes for "object-with-metadata-versioned-1" requesting "<attributes>" with the latest version
        Then the operation finished without error
        And the GetObjectAttributes response should contain "<expectedAttributes>" with values "<expectedValues>"

        Examples:
            | attributes                    | expectedAttributes            | expectedValues           |
            | ObjectSize                    | ObjectSize                    | 100                      |
            | StorageClass                  | StorageClass                  | STANDARD                 |
            | ETag                          | ETag                          | {savedETag}              |
            | ObjectSize,StorageClass,ETag  | ObjectSize,StorageClass,ETag  | 100,STANDARD,{savedETag} |
            | x-amz-meta-foo                | x-amz-meta-foo                | bar                      |
            | x-amz-meta-baz                | x-amz-meta-baz                | qux                      |
            | x-amz-meta-foo,x-amz-meta-baz | x-amz-meta-foo,x-amz-meta-baz | bar,qux                  |
            | ETag,x-amz-meta-bar           | ETag,x-amz-meta-bar           | {savedETag},             |
            | ETag,x-amz-meta-foo           | ETag,x-amz-meta-foo           | {savedETag},bar          |
            | x-amz-meta-bar                | x-amz-meta-bar                |                          |
            | x-amz-meta-nonexistent        | x-amz-meta-nonexistent        |                          |
            | x-amz-meta-*                  | x-amz-meta-foo,x-amz-meta-baz | bar,qux                  |

