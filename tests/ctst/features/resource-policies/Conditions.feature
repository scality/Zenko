# This file was generated using generate.js

Feature: S3 Bucket Policies Conditions
    Bucket policies conditions controls when a policy is in effect. They are independent
    from the API(s) being called. They are used to control the effect of the policy
    based on the context of the request. For example, you can use conditions to
    control access to a bucket based on the IP address of the requestor.

    @2.6.0
    @PreMerge
    @BucketPolicies
    @BucketPoliciesConditions
    Scenario Outline: Bucket policies with IP address conditions
        Given an action "GetObject"
        And an existing bucket prepared for the action
        And a IAM_USER type
        And an environment setup for the API
        And an "non-existing" IAM Policy that "" with "" effect for the current API
        And a condition for the bucket policy with "<conditionVerb>" "<conditionType>" "<conditionValue>" expecting "<expect>"
        And an "existing" S3 Bucket Policy that "applies" with "ALLOW" effect for the current API
        When the user tries to perform the current S3 action on the bucket
        Then the authorization result is correct
        Examples:
            | conditionVerb | conditionType | conditionValue | expect |
            | IpAddress     | aws:SourceIp  | 0.0.0.0/0      | Allow  |
            | NotIpAddress  | aws:SourceIp  | 10.0.1.0       | Allow  |
            | IpAddress     | aws:SourceIp  | 192.0.0.1      | Deny   |

    @2.6.0
    @PreMerge
    @BucketPolicies
    @BucketPoliciesConditions
    Scenario Outline: Bucket policies with retention days conditions
        Given an action "PutObjectRetention"
        And an existing bucket prepared for the action
        And a IAM_USER type
        And an environment setup for the API
        And an "non-existing" IAM Policy that "" with "" effect for the current API
        And a condition for the bucket policy with "<conditionVerb>" "<conditionType>" "<conditionValue>" expecting "<expect>"
        And an "existing" S3 Bucket Policy that "applies" with "ALLOW" effect for the current API
        And a retention date set to "<retentionDate>" days
        When the user tries to perform the current S3 action on the bucket
        Then the authorization result is correct
        Examples:
            | conditionVerb         | conditionType                           | retentionDate | conditionValue | expect |
            | NumericLessThanEquals | s3:object-lock-remaining-retention-days | 80            | 100            | Allow  |
            | NumericGreaterThan    | s3:object-lock-remaining-retention-days | 80            | 100            | Deny   |
            | NumericEquals         | s3:object-lock-remaining-retention-days | 100           | 100            | Allow  |
            | NumericGreaterThan    | s3:object-lock-remaining-retention-days | 200           | 100            | Allow  |
            | NumericLessThan       | s3:object-lock-remaining-retention-days | 200           | 100            | Deny   |