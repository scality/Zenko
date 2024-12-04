Feature: Quota Management for APIs
    This feature ensures that quotas are correctly set and honored
    for different APIs.

    @2.6.0
    @PreMerge
    @Quotas
    @CronJob
    @DataWrite
    Scenario Outline: Quotas are evaluated during write operations
        Given an action "<action>"
        And an upload size of <uploadSize> B for the object ""
        And a STORAGE_MANAGER type
        And a bucket quota set to <bucketQuota> B
        And an account quota set to <accountQuota> B
        And a <userType> type
        And an environment setup for the API
        And an "existing" IAM Policy that "applies" with "ALLOW" effect for the current API
        When the user tries to perform the current S3 action on the bucket 20 times with a 400 ms delay
        Then the API should "<result>" with "<expectedError>"

        Examples:
            | action         | uploadSize | bucketQuota | accountQuota | userType | result  | expectedError |
            | PutObject      | 10         | 0           | 0            | ACCOUNT  | succeed |               |
            | PutObject      | 10         | 100         | 0            | ACCOUNT  | fail    | QuotaExceeded |
            | PutObject      | 10         | 0           | 100          | ACCOUNT  | fail    | QuotaExceeded |
            | PutObject      | 10         | 100         | 100          | ACCOUNT  | fail    | QuotaExceeded |
            | PutObject      | 10         | 300         | 300          | ACCOUNT  | succeed |               |
            | PutObject      | 10         | 0           | 0            | IAM_USER | succeed |               |
            | PutObject      | 10         | 100         | 0            | IAM_USER | fail    | QuotaExceeded |
            | PutObject      | 10         | 0           | 100          | IAM_USER | fail    | QuotaExceeded |
            | PutObject      | 10         | 100         | 100          | IAM_USER | fail    | QuotaExceeded |
            | PutObject      | 10         | 300         | 300          | IAM_USER | succeed |               |
            | CopyObject     | 10         | 0           | 0            | ACCOUNT  | succeed |               |
            | CopyObject     | 10         | 100         | 0            | ACCOUNT  | fail    | QuotaExceeded |
            | CopyObject     | 10         | 0           | 100          | ACCOUNT  | fail    | QuotaExceeded |
            | CopyObject     | 10         | 100         | 100          | ACCOUNT  | fail    | QuotaExceeded |
            | CopyObject     | 10         | 300         | 300          | ACCOUNT  | succeed |               |
            | CopyObject     | 10         | 0           | 0            | IAM_USER | succeed |               |
            | CopyObject     | 10         | 100         | 0            | IAM_USER | fail    | QuotaExceeded |
            | CopyObject     | 10         | 0           | 100          | IAM_USER | fail    | QuotaExceeded |
            | CopyObject     | 10         | 100         | 100          | IAM_USER | fail    | QuotaExceeded |
            | CopyObject     | 10         | 300         | 300          | IAM_USER | succeed |               |
            | UploadPart     | 10         | 0           | 0            | ACCOUNT  | succeed |               |
            | UploadPart     | 10         | 100         | 0            | ACCOUNT  | fail    | QuotaExceeded |
            | UploadPart     | 10         | 0           | 100          | ACCOUNT  | fail    | QuotaExceeded |
            | UploadPart     | 10         | 100         | 100          | ACCOUNT  | fail    | QuotaExceeded |
            | UploadPart     | 10         | 300         | 300          | ACCOUNT  | succeed |               |
            | UploadPart     | 10         | 0           | 0            | IAM_USER | succeed |               |
            | UploadPart     | 10         | 100         | 0            | IAM_USER | fail    | QuotaExceeded |
            | UploadPart     | 10         | 0           | 100          | IAM_USER | fail    | QuotaExceeded |
            | UploadPart     | 10         | 100         | 100          | IAM_USER | fail    | QuotaExceeded |
            | UploadPart     | 10         | 300         | 300          | IAM_USER | succeed |               |
            | UploadPartCopy | 10         | 0           | 0            | ACCOUNT  | succeed |               |
            | UploadPartCopy | 10         | 100         | 0            | ACCOUNT  | fail    | QuotaExceeded |
            | UploadPartCopy | 10         | 0           | 100          | ACCOUNT  | fail    | QuotaExceeded |
            | UploadPartCopy | 10         | 100         | 100          | ACCOUNT  | fail    | QuotaExceeded |
            | UploadPartCopy | 10         | 300         | 300          | ACCOUNT  | succeed |               |
            | UploadPartCopy | 10         | 0           | 0            | IAM_USER | succeed |               |
            | UploadPartCopy | 10         | 100         | 0            | IAM_USER | fail    | QuotaExceeded |
            | UploadPartCopy | 10         | 0           | 100          | IAM_USER | fail    | QuotaExceeded |
            | UploadPartCopy | 10         | 100         | 100          | IAM_USER | fail    | QuotaExceeded |
            | UploadPartCopy | 10         | 300         | 300          | IAM_USER | succeed |               |

    @2.6.0
    @PreMerge
    @Quotas
    @CronJob
    @DataDeletion
    @NonVersioned
    Scenario Outline: Quotas are affected by deletion operations
        Given an action "DeleteObject"
        And a permission to perform the "PutObject" action
        And a STORAGE_MANAGER type
        And a bucket quota set to <bucketQuota> B
        And an account quota set to <accountQuota> B
        And an upload size of 200 B for the object "obj-1"
        And a <userType> type
        And an environment setup for the API
        And an "existing" IAM Policy that "applies" with "ALLOW" effect for the current API
        When I wait 3 seconds
        And I PUT an object with size <uploadSize>
        Then the API should "fail" with "QuotaExceeded"
        When i delete object "obj-1"
        And I wait 3 seconds
        And I PUT an object with size <uploadSize>
        Then the API should "succeed" with ""

        Examples:
            | uploadSize | bucketQuota | accountQuota | userType |
            | 100        | 200         | 0            | ACCOUNT  |
            | 100        | 0           | 200          | ACCOUNT  |
            | 100        | 200         | 200          | ACCOUNT  |
            | 100        | 200         | 0            | IAM_USER |
            | 100        | 0           | 200          | IAM_USER |
            | 100        | 200         | 200          | IAM_USER |

    @2.6.0
    @PreMerge
    @Quotas
    @CronJob
    @DataDeletion
    @NonVersioned
    Scenario Outline: Quotas are affected by deletion operations between count items runs
        Given an action "DeleteObject"
        And a permission to perform the "PutObject" action
        And a STORAGE_MANAGER type
        And a bucket quota set to 1000 B
        And an account quota set to 1000 B
        And an upload size of 1000 B for the object "obj-1"
        And a bucket quota set to <bucketQuota> B
        And an account quota set to <accountQuota> B
        And a <userType> type
        And an environment setup for the API
        And an "existing" IAM Policy that "applies" with "ALLOW" effect for the current API
        When I wait 3 seconds
        And I PUT an object with size <uploadSize>
        Then the API should "fail" with "QuotaExceeded"
        When the "count-items" cronjobs completes without error
        # Wait for inflights to be read by SCUBA
        When I wait 3 seconds
        # At this point if negative inflights are not supported, write should
        # not be possible, as the previous inflights are now part of the current
        # metrics.
        And i delete object "obj-1"
        # Wait for inflights to be read by SCUBA
        And I wait 3 seconds
        And I PUT an object with size <uploadSize>
        Then the API should "succeed" with ""

        Examples:
            | uploadSize | bucketQuota | accountQuota | userType |
            | 100        | 200         | 0            | ACCOUNT  |

    @2.6.0
    @PreMerge
    @Quotas
    @CronJob
    @DataDeletion
    @NonVersioned
    Scenario Outline: Negative inflights do not allow to bypass the quota
        Given an action "DeleteObject"
        And a permission to perform the "PutObject" action
        And a STORAGE_MANAGER type
        And a bucket quota set to 1000 B
        And an account quota set to 1000 B
        And an upload size of 1000 B for the object "obj-1"
        And a bucket quota set to <bucketQuota> B
        And an account quota set to <accountQuota> B
        And a <userType> type
        And an environment setup for the API
        And an "existing" IAM Policy that "applies" with "ALLOW" effect for the current API
        When I wait 3 seconds
        And I PUT an object with size <uploadSize>
        Then the API should "fail" with "QuotaExceeded"
        When the "count-items" cronjobs completes without error
        # Wait for inflights to be read by SCUBA
        When I wait 3 seconds
        # At this point if negative inflights are not supported, write should
        # not be possible, as the previous inflights are now part of the current
        # metrics.
        And i delete object "obj-1"
        # Wait for inflights to be read by SCUBA
        And I wait 3 seconds
        And I PUT an object with size 1000
        Then the API should "fail" with "QuotaExceeded"

        Examples:
            | uploadSize | bucketQuota | accountQuota | userType |
            | 200        | 200         | 0            | ACCOUNT  |

    @2.6.0
    @PreMerge
    @Quotas
    @Restore
    @Dmf
    @ColdStorage
    Scenario Outline: Object restoration implements strict quotas
        Given an action "<action>"
        And a STORAGE_MANAGER type
        And a transition workflow to "e2e-cold" location
        And an upload size of <uploadSize> B for the object ""
        Then object "" should be "transitioned" and have the storage class "e2e-cold"
        Given a bucket quota set to <bucketQuota> B
        And an account quota set to <accountQuota> B
        And a <userType> type
        And an environment setup for the API
        And an "existing" IAM Policy that "applies" with "ALLOW" effect for the current API
        When i restore object "" for 5 days
        Then the API should "<result>" with "<expectedError>"

        Examples:
            | action        | uploadSize | bucketQuota | accountQuota | userType | result  | expectedError | retryNumber |
            | RestoreObject | 100        | 0           | 0            | ACCOUNT  | succeed |               | 3           |
            | RestoreObject | 100        | 99          | 0            | ACCOUNT  | fail    | QuotaExceeded | 3           |
            | RestoreObject | 100        | 0           | 99           | ACCOUNT  | fail    | QuotaExceeded | 3           |
            | RestoreObject | 100        | 99          | 99           | ACCOUNT  | fail    | QuotaExceeded | 3           |
            | RestoreObject | 100        | 101         | 101          | ACCOUNT  | succeed |               | 3           |
            | RestoreObject | 100        | 0           | 0            | IAM_USER | succeed |               | 3           |
            | RestoreObject | 100        | 99          | 0            | IAM_USER | fail    | QuotaExceeded | 3           |
            | RestoreObject | 100        | 0           | 99           | IAM_USER | fail    | QuotaExceeded | 3           |
            | RestoreObject | 100        | 99          | 99           | IAM_USER | fail    | QuotaExceeded | 3           |
            | RestoreObject | 100        | 101         | 101          | IAM_USER | succeed |               | 3           |

    @2.6.0
    @PreMerge
    @Quotas
    @Restore
    @Dmf
    @ColdStorage
    @Only
    Scenario Outline: Restored object expiration updates quotas
        Given an action "<action>"
        And a STORAGE_MANAGER type
        And a transition workflow to "e2e-cold" location
        And an upload size of <uploadSize> B for the object "obj-1"
        Then object "obj-1" should be "transitioned" and have the storage class "e2e-cold"
        Given a bucket quota set to <bucketQuota> B
        And an account quota set to <accountQuota> B
        And a <userType> type
        And an environment setup for the API
        And an "existing" IAM Policy that "applies" with "ALLOW" effect for the current API
        When i restore object "" for 5 days
        Then the API should "succeed" with ""
        And object "obj-1" should be "restored" and have the storage class "e2e-cold"
        Given a STORAGE_MANAGER type
        Then object "obj-1" should expire in 5 days
        When i wait for 5 days
        Then object "obj-1" should be "cold" and have the storage class "e2e-cold"

        Examples:
            | action        | uploadSize | bucketQuota | accountQuota | userType |
            | RestoreObject | 100        | 0           | 0            | ACCOUNT  |
            | RestoreObject | 100        | 101         | 101          | ACCOUNT  |