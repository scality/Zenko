Feature: Quota Management for APIs
    This feature ensures that quotas are correctly set and honored
    for different APIs.

    # TODO:
    # - Authz of Quota APIs: only storage manager should be allowed to edit by default
    # - Quota evaluation: should work for all types of identities (roles, accounts, users)
    # - Inflights must be properly handled in a test pushing in 2 steps
    # - Same as above but should not wait, for Restore Object
    @2.6.0
    @PreMerge
    @Quotas
    @DataWrite
    Scenario Outline: Quotas are evaluated during write operations
        Given an action "<action>"
        And an upload size of "<uploadSize>" B
        And an existing bucket prepared for the action
        And a "STORAGE_MANAGER" type
        And a bucket quota set to "<bucketQuota>" B
        And an account quota set to "<accountQuota>" B
        And a "<userType>" type
        And an "existing" IAM Policy that "applies" with "ALLOW" effect for the current API
        When the user tries to perform the current S3 action on the bucket
        Then the API should "<result>" with "<expectedError>"

        Examples:
            | action        | uploadSize | bucketQuota | accountQuota | userType | result  | expectedError |
            | PutObject     | 100        | 0           | 0            | ACCOUNT  | succeed |               |
            | PutObject     | 100        | 99          | 0            | ACCOUNT  | fail    | QuotaExceeded |
            | PutObject     | 100        | 0           | 99           | ACCOUNT  | fail    | QuotaExceeded |
            | PutObject     | 100        | 99          | 99           | ACCOUNT  | fail    | QuotaExceeded |
            | PutObject     | 100        | 101         | 101          | ACCOUNT  | succeed |               |
            | PutObject     | 100        | 0           | 0            | USER     | succeed |               |
            | PutObject     | 100        | 99          | 0            | USER     | fail    | QuotaExceeded |
            | PutObject     | 100        | 0           | 99           | USER     | fail    | QuotaExceeded |
            | PutObject     | 100        | 99          | 99           | USER     | fail    | QuotaExceeded |
            | PutObject     | 100        | 101         | 101          | USER     | succeed |               |
            | CopyObject    | 100        | 0           | 0            | ACCOUNT  | succeed |               |
            | CopyObject    | 100        | 99          | 0            | ACCOUNT  | fail    | QuotaExceeded |
            | CopyObject    | 100        | 0           | 99           | ACCOUNT  | fail    | QuotaExceeded |
            | CopyObject    | 100        | 99          | 99           | ACCOUNT  | fail    | QuotaExceeded |
            | CopyObject    | 100        | 101         | 101          | ACCOUNT  | succeed |               |
            | CopyObject    | 100        | 0           | 0            | USER     | succeed |               |
            | CopyObject    | 100        | 99          | 0            | USER     | fail    | QuotaExceeded |
            | CopyObject    | 100        | 0           | 99           | USER     | fail    | QuotaExceeded |
            | CopyObject    | 100        | 99          | 99           | USER     | fail    | QuotaExceeded |
            | CopyObject    | 100        | 101         | 101          | USER     | succeed |               |
            | UploadPart    | 100        | 0           | 0            | ACCOUNT  | succeed |               |
            | UploadPart    | 100        | 99          | 0            | ACCOUNT  | fail    | QuotaExceeded |
            | UploadPart    | 100        | 0           | 99           | ACCOUNT  | fail    | QuotaExceeded |
            | UploadPart    | 100        | 99          | 99           | ACCOUNT  | fail    | QuotaExceeded |
            | UploadPart    | 100        | 101         | 101          | ACCOUNT  | succeed |               |
            | UploadPart    | 100        | 0           | 0            | USER     | succeed |               |
            | UploadPart    | 100        | 99          | 0            | USER     | fail    | QuotaExceeded |
            | UploadPart    | 100        | 0           | 99           | USER     | fail    | QuotaExceeded |
            | UploadPart    | 100        | 99          | 99           | USER     | fail    | QuotaExceeded |
            | UploadPart    | 100        | 101         | 101          | USER     | succeed |               |
            | RestoreObject | 100        | 0           | 0            | ACCOUNT  | succeed |               |
            | RestoreObject | 100        | 99          | 0            | ACCOUNT  | fail    | QuotaExceeded |
            | RestoreObject | 100        | 0           | 99           | ACCOUNT  | fail    | QuotaExceeded |
            | RestoreObject | 100        | 99          | 99           | ACCOUNT  | fail    | QuotaExceeded |
            | RestoreObject | 100        | 101         | 101          | ACCOUNT  | succeed |               |
            | RestoreObject | 100        | 0           | 0            | USER     | succeed |               |
            | RestoreObject | 100        | 99          | 0            | USER     | fail    | QuotaExceeded |
            | RestoreObject | 100        | 0           | 99           | USER     | fail    | QuotaExceeded |
            | RestoreObject | 100        | 99          | 99           | USER     | fail    | QuotaExceeded |
            | RestoreObject | 100        | 101         | 101          | USER     | succeed |               |
