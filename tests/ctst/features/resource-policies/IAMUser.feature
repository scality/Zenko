Feature: S3 Bucket Policies Authorization flow for IAM Users
    This feature allows you to create and attach bucket policies to S3 buckets.
    IAM Users should have the permissions to perform the actions that they are granted in their bucket policies
    based on the other permissions they also have.
    This test suite is not meant to be human-readable, but brings confidence in our Authz flow for all supported
    S3 actions.

    @2.6.0
    @PreMerge
    @BucketPolicies
    @BP-IAM_USER
    Scenario Outline: IAM USER: <iamPolicyExists> <iamPolicyApplies> <iamPolicyEffect> IAM Policy and <bucketPolicyExists> <bucketPolicyApplies> <bucketPolicyEffect> S3 Bucket Policy
        Given an action "<action>"
        And an existing bucket prepared for the action
        And a IAM_USER type
        And an environment setup for the API
        And an "<iamPolicyExists>" IAM Policy that "<iamPolicyApplies>" with "<iamPolicyEffect>" effect for the current API
        And an "<bucketPolicyExists>" S3 Bucket Policy that "<bucketPolicyApplies>" with "<bucketPolicyEffect>" effect for the current API
        When the user tries to perform the current S3 action on the bucket
        Then the authorization result is correct
        Examples:
            | action                             | bucketPolicyExists | bucketPolicyApplies | bucketPolicyEffect | iamPolicyExists | iamPolicyApplies | iamPolicyEffect |
            # Everything below is generated
            | AbortMultipartUpload               | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | AbortMultipartUpload               | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | AbortMultipartUpload               | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | AbortMultipartUpload               | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | AbortMultipartUpload               | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | AbortMultipartUpload               | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | AbortMultipartUpload               | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | AbortMultipartUpload               | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | AbortMultipartUpload               | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | AbortMultipartUpload               | existing           | applies             | DENY               | non-existing    |                  |                 |
            | AbortMultipartUpload               | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | AbortMultipartUpload               | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | AbortMultipartUpload               | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | AbortMultipartUpload               | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | AbortMultipartUpload               | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | AbortMultipartUpload               | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | AbortMultipartUpload               | non-existing       |                     |                    | existing        | applies          | DENY            |
            | AbortMultipartUpload               | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | AbortMultipartUpload               | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | AbortMultipartUpload               | non-existing       |                     |                    | non-existing    |                  |                 |
            | CompleteMultipartUpload            | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | CompleteMultipartUpload            | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | CompleteMultipartUpload            | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | CompleteMultipartUpload            | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | CompleteMultipartUpload            | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | CompleteMultipartUpload            | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | CompleteMultipartUpload            | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | CompleteMultipartUpload            | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | CompleteMultipartUpload            | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | CompleteMultipartUpload            | existing           | applies             | DENY               | non-existing    |                  |                 |
            | CompleteMultipartUpload            | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | CompleteMultipartUpload            | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | CompleteMultipartUpload            | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | CompleteMultipartUpload            | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | CompleteMultipartUpload            | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | CompleteMultipartUpload            | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | CompleteMultipartUpload            | non-existing       |                     |                    | existing        | applies          | DENY            |
            | CompleteMultipartUpload            | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | CompleteMultipartUpload            | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | CompleteMultipartUpload            | non-existing       |                     |                    | non-existing    |                  |                 |
            | CopyObject                         | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | CopyObject                         | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | CopyObject                         | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | CopyObject                         | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | CopyObject                         | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | CopyObject                         | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | CopyObject                         | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | CopyObject                         | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | CopyObject                         | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | CopyObject                         | existing           | applies             | DENY               | non-existing    |                  |                 |
            | CopyObject                         | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | CopyObject                         | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | CopyObject                         | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | CopyObject                         | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | CopyObject                         | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | CopyObject                         | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | CopyObject                         | non-existing       |                     |                    | existing        | applies          | DENY            |
            | CopyObject                         | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | CopyObject                         | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | CopyObject                         | non-existing       |                     |                    | non-existing    |                  |                 |
            | CreateMultipartUpload              | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | CreateMultipartUpload              | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | CreateMultipartUpload              | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | CreateMultipartUpload              | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | CreateMultipartUpload              | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | CreateMultipartUpload              | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | CreateMultipartUpload              | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | CreateMultipartUpload              | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | CreateMultipartUpload              | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | CreateMultipartUpload              | existing           | applies             | DENY               | non-existing    |                  |                 |
            | CreateMultipartUpload              | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | CreateMultipartUpload              | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | CreateMultipartUpload              | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | CreateMultipartUpload              | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | CreateMultipartUpload              | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | CreateMultipartUpload              | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | CreateMultipartUpload              | non-existing       |                     |                    | existing        | applies          | DENY            |
            | CreateMultipartUpload              | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | CreateMultipartUpload              | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | CreateMultipartUpload              | non-existing       |                     |                    | non-existing    |                  |                 |
            | DeleteBucket                       | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteBucket                       | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | DeleteBucket                       | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteBucket                       | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteBucket                       | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | DeleteBucket                       | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | DeleteBucket                       | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | DeleteBucket                       | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | DeleteBucket                       | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | DeleteBucket                       | existing           | applies             | DENY               | non-existing    |                  |                 |
            | DeleteBucket                       | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteBucket                       | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | DeleteBucket                       | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteBucket                       | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteBucket                       | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | DeleteBucket                       | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | DeleteBucket                       | non-existing       |                     |                    | existing        | applies          | DENY            |
            | DeleteBucket                       | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | DeleteBucket                       | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | DeleteBucket                       | non-existing       |                     |                    | non-existing    |                  |                 |
            | DeleteBucketCors                   | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteBucketCors                   | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | DeleteBucketCors                   | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketCors                   | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteBucketCors                   | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | DeleteBucketCors                   | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | DeleteBucketCors                   | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | DeleteBucketCors                   | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketCors                   | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | DeleteBucketCors                   | existing           | applies             | DENY               | non-existing    |                  |                 |
            | DeleteBucketCors                   | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteBucketCors                   | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | DeleteBucketCors                   | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketCors                   | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteBucketCors                   | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | DeleteBucketCors                   | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | DeleteBucketCors                   | non-existing       |                     |                    | existing        | applies          | DENY            |
            | DeleteBucketCors                   | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketCors                   | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | DeleteBucketCors                   | non-existing       |                     |                    | non-existing    |                  |                 |
            | DeleteBucketEncryption             | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteBucketEncryption             | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | DeleteBucketEncryption             | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketEncryption             | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteBucketEncryption             | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | DeleteBucketEncryption             | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | DeleteBucketEncryption             | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | DeleteBucketEncryption             | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketEncryption             | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | DeleteBucketEncryption             | existing           | applies             | DENY               | non-existing    |                  |                 |
            | DeleteBucketEncryption             | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteBucketEncryption             | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | DeleteBucketEncryption             | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketEncryption             | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteBucketEncryption             | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | DeleteBucketEncryption             | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | DeleteBucketEncryption             | non-existing       |                     |                    | existing        | applies          | DENY            |
            | DeleteBucketEncryption             | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketEncryption             | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | DeleteBucketEncryption             | non-existing       |                     |                    | non-existing    |                  |                 |
            | DeleteBucketLifecycle              | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteBucketLifecycle              | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | DeleteBucketLifecycle              | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketLifecycle              | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteBucketLifecycle              | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | DeleteBucketLifecycle              | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | DeleteBucketLifecycle              | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | DeleteBucketLifecycle              | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketLifecycle              | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | DeleteBucketLifecycle              | existing           | applies             | DENY               | non-existing    |                  |                 |
            | DeleteBucketLifecycle              | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteBucketLifecycle              | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | DeleteBucketLifecycle              | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketLifecycle              | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteBucketLifecycle              | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | DeleteBucketLifecycle              | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | DeleteBucketLifecycle              | non-existing       |                     |                    | existing        | applies          | DENY            |
            | DeleteBucketLifecycle              | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketLifecycle              | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | DeleteBucketLifecycle              | non-existing       |                     |                    | non-existing    |                  |                 |
            | DeleteBucketPolicy                 | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteBucketPolicy                 | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | DeleteBucketPolicy                 | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketPolicy                 | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteBucketPolicy                 | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | DeleteBucketPolicy                 | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | DeleteBucketPolicy                 | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | DeleteBucketPolicy                 | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketPolicy                 | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | DeleteBucketPolicy                 | existing           | applies             | DENY               | non-existing    |                  |                 |
            | DeleteBucketPolicy                 | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteBucketPolicy                 | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | DeleteBucketPolicy                 | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketPolicy                 | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteBucketPolicy                 | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | DeleteBucketPolicy                 | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | DeleteBucketPolicy                 | non-existing       |                     |                    | existing        | applies          | DENY            |
            | DeleteBucketPolicy                 | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketPolicy                 | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | DeleteBucketPolicy                 | non-existing       |                     |                    | non-existing    |                  |                 |
            | DeleteBucketReplication            | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteBucketReplication            | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | DeleteBucketReplication            | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketReplication            | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteBucketReplication            | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | DeleteBucketReplication            | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | DeleteBucketReplication            | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | DeleteBucketReplication            | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketReplication            | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | DeleteBucketReplication            | existing           | applies             | DENY               | non-existing    |                  |                 |
            | DeleteBucketReplication            | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteBucketReplication            | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | DeleteBucketReplication            | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketReplication            | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteBucketReplication            | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | DeleteBucketReplication            | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | DeleteBucketReplication            | non-existing       |                     |                    | existing        | applies          | DENY            |
            | DeleteBucketReplication            | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketReplication            | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | DeleteBucketReplication            | non-existing       |                     |                    | non-existing    |                  |                 |
            | DeleteBucketWebsite                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteBucketWebsite                | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | DeleteBucketWebsite                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketWebsite                | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteBucketWebsite                | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | DeleteBucketWebsite                | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | DeleteBucketWebsite                | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | DeleteBucketWebsite                | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketWebsite                | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | DeleteBucketWebsite                | existing           | applies             | DENY               | non-existing    |                  |                 |
            | DeleteBucketWebsite                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteBucketWebsite                | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | DeleteBucketWebsite                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketWebsite                | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteBucketWebsite                | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | DeleteBucketWebsite                | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | DeleteBucketWebsite                | non-existing       |                     |                    | existing        | applies          | DENY            |
            | DeleteBucketWebsite                | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketWebsite                | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | DeleteBucketWebsite                | non-existing       |                     |                    | non-existing    |                  |                 |
            | DeleteObject                       | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteObject                       | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | DeleteObject                       | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteObject                       | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteObject                       | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | DeleteObject                       | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | DeleteObject                       | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | DeleteObject                       | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | DeleteObject                       | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | DeleteObject                       | existing           | applies             | DENY               | non-existing    |                  |                 |
            | DeleteObject                       | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteObject                       | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | DeleteObject                       | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteObject                       | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteObject                       | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | DeleteObject                       | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | DeleteObject                       | non-existing       |                     |                    | existing        | applies          | DENY            |
            | DeleteObject                       | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | DeleteObject                       | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | DeleteObject                       | non-existing       |                     |                    | non-existing    |                  |                 |
            | DeleteBucketTagging                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteBucketTagging                | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | DeleteBucketTagging                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketTagging                | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteBucketTagging                | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | DeleteBucketTagging                | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | DeleteBucketTagging                | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | DeleteBucketTagging                | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketTagging                | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | DeleteBucketTagging                | existing           | applies             | DENY               | non-existing    |                  |                 |
            | DeleteBucketTagging                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteBucketTagging                | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | DeleteBucketTagging                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketTagging                | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteBucketTagging                | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | DeleteBucketTagging                | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | DeleteBucketTagging                | non-existing       |                     |                    | existing        | applies          | DENY            |
            | DeleteBucketTagging                | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | DeleteBucketTagging                | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | DeleteBucketTagging                | non-existing       |                     |                    | non-existing    |                  |                 |
            | DeleteObjectTagging                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteObjectTagging                | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | DeleteObjectTagging                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteObjectTagging                | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteObjectTagging                | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | DeleteObjectTagging                | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | DeleteObjectTagging                | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | DeleteObjectTagging                | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | DeleteObjectTagging                | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | DeleteObjectTagging                | existing           | applies             | DENY               | non-existing    |                  |                 |
            | DeleteObjectTagging                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteObjectTagging                | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | DeleteObjectTagging                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteObjectTagging                | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteObjectTagging                | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | DeleteObjectTagging                | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | DeleteObjectTagging                | non-existing       |                     |                    | existing        | applies          | DENY            |
            | DeleteObjectTagging                | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | DeleteObjectTagging                | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | DeleteObjectTagging                | non-existing       |                     |                    | non-existing    |                  |                 |
            | DeleteObjects                      | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteObjects                      | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | DeleteObjects                      | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteObjects                      | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteObjects                      | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | DeleteObjects                      | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | DeleteObjects                      | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | DeleteObjects                      | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | DeleteObjects                      | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | DeleteObjects                      | existing           | applies             | DENY               | non-existing    |                  |                 |
            | DeleteObjects                      | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteObjects                      | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | DeleteObjects                      | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteObjects                      | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteObjects                      | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | DeleteObjects                      | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | DeleteObjects                      | non-existing       |                     |                    | existing        | applies          | DENY            |
            | DeleteObjects                      | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | DeleteObjects                      | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | DeleteObjects                      | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetBucketAcl                       | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketAcl                       | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetBucketAcl                       | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketAcl                       | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketAcl                       | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetBucketAcl                       | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetBucketAcl                       | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetBucketAcl                       | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetBucketAcl                       | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetBucketAcl                       | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetBucketAcl                       | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketAcl                       | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetBucketAcl                       | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketAcl                       | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketAcl                       | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetBucketAcl                       | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetBucketAcl                       | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetBucketAcl                       | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetBucketAcl                       | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetBucketAcl                       | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetBucketCors                      | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketCors                      | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetBucketCors                      | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketCors                      | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketCors                      | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetBucketCors                      | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetBucketCors                      | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetBucketCors                      | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetBucketCors                      | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetBucketCors                      | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetBucketCors                      | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketCors                      | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetBucketCors                      | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketCors                      | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketCors                      | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetBucketCors                      | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetBucketCors                      | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetBucketCors                      | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetBucketCors                      | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetBucketCors                      | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetBucketEncryption                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketEncryption                | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetBucketEncryption                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketEncryption                | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketEncryption                | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetBucketEncryption                | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetBucketEncryption                | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetBucketEncryption                | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetBucketEncryption                | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetBucketEncryption                | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetBucketEncryption                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketEncryption                | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetBucketEncryption                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketEncryption                | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketEncryption                | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetBucketEncryption                | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetBucketEncryption                | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetBucketEncryption                | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetBucketEncryption                | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetBucketEncryption                | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetBucketLifecycleConfiguration    | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketLifecycleConfiguration    | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetBucketLifecycleConfiguration    | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketLifecycleConfiguration    | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketLifecycleConfiguration    | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetBucketLifecycleConfiguration    | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetBucketLifecycleConfiguration    | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetBucketLifecycleConfiguration    | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetBucketLifecycleConfiguration    | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetBucketLifecycleConfiguration    | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetBucketLifecycleConfiguration    | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketLifecycleConfiguration    | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetBucketLifecycleConfiguration    | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketLifecycleConfiguration    | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketLifecycleConfiguration    | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetBucketLifecycleConfiguration    | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetBucketLifecycleConfiguration    | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetBucketLifecycleConfiguration    | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetBucketLifecycleConfiguration    | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetBucketLifecycleConfiguration    | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetBucketNotificationConfiguration | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketNotificationConfiguration | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetBucketNotificationConfiguration | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketNotificationConfiguration | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketNotificationConfiguration | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetBucketNotificationConfiguration | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetBucketNotificationConfiguration | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetBucketNotificationConfiguration | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetBucketNotificationConfiguration | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetBucketNotificationConfiguration | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetBucketNotificationConfiguration | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketNotificationConfiguration | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetBucketNotificationConfiguration | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketNotificationConfiguration | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketNotificationConfiguration | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetBucketNotificationConfiguration | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetBucketNotificationConfiguration | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetBucketNotificationConfiguration | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetBucketNotificationConfiguration | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetBucketNotificationConfiguration | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetBucketPolicy                    | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketPolicy                    | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetBucketPolicy                    | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketPolicy                    | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketPolicy                    | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetBucketPolicy                    | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetBucketPolicy                    | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetBucketPolicy                    | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetBucketPolicy                    | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetBucketPolicy                    | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetBucketPolicy                    | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketPolicy                    | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetBucketPolicy                    | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketPolicy                    | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketPolicy                    | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetBucketPolicy                    | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetBucketPolicy                    | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetBucketPolicy                    | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetBucketPolicy                    | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetBucketPolicy                    | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetBucketReplication               | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketReplication               | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetBucketReplication               | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketReplication               | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketReplication               | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetBucketReplication               | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetBucketReplication               | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetBucketReplication               | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetBucketReplication               | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetBucketReplication               | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetBucketReplication               | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketReplication               | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetBucketReplication               | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketReplication               | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketReplication               | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetBucketReplication               | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetBucketReplication               | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetBucketReplication               | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetBucketReplication               | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetBucketReplication               | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetBucketVersioning                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketVersioning                | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetBucketVersioning                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketVersioning                | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketVersioning                | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetBucketVersioning                | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetBucketVersioning                | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetBucketVersioning                | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetBucketVersioning                | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetBucketVersioning                | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetBucketVersioning                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketVersioning                | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetBucketVersioning                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketVersioning                | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketVersioning                | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetBucketVersioning                | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetBucketVersioning                | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetBucketVersioning                | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetBucketVersioning                | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetBucketVersioning                | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetObject                          | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetObject                          | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetObject                          | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObject                          | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObject                          | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetObject                          | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetObject                          | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetObject                          | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetObject                          | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetObject                          | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetObject                          | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetObject                          | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetObject                          | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObject                          | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObject                          | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetObject                          | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetObject                          | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetObject                          | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetObject                          | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetObject                          | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetObjectAcl                       | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetObjectAcl                       | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetObjectAcl                       | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObjectAcl                       | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObjectAcl                       | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetObjectAcl                       | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetObjectAcl                       | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetObjectAcl                       | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetObjectAcl                       | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetObjectAcl                       | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetObjectAcl                       | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetObjectAcl                       | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetObjectAcl                       | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObjectAcl                       | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObjectAcl                       | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetObjectAcl                       | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetObjectAcl                       | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetObjectAcl                       | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetObjectAcl                       | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetObjectAcl                       | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetObjectLegalHold                 | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetObjectLegalHold                 | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetObjectLegalHold                 | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObjectLegalHold                 | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObjectLegalHold                 | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetObjectLegalHold                 | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetObjectLegalHold                 | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetObjectLegalHold                 | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetObjectLegalHold                 | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetObjectLegalHold                 | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetObjectLegalHold                 | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetObjectLegalHold                 | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetObjectLegalHold                 | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObjectLegalHold                 | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObjectLegalHold                 | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetObjectLegalHold                 | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetObjectLegalHold                 | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetObjectLegalHold                 | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetObjectLegalHold                 | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetObjectLegalHold                 | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetObjectLockConfiguration         | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetObjectLockConfiguration         | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetObjectLockConfiguration         | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObjectLockConfiguration         | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObjectLockConfiguration         | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetObjectLockConfiguration         | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetObjectLockConfiguration         | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetObjectLockConfiguration         | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetObjectLockConfiguration         | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetObjectLockConfiguration         | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetObjectLockConfiguration         | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetObjectLockConfiguration         | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetObjectLockConfiguration         | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObjectLockConfiguration         | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObjectLockConfiguration         | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetObjectLockConfiguration         | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetObjectLockConfiguration         | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetObjectLockConfiguration         | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetObjectLockConfiguration         | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetObjectLockConfiguration         | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetObjectRetention                 | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetObjectRetention                 | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetObjectRetention                 | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObjectRetention                 | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObjectRetention                 | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetObjectRetention                 | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetObjectRetention                 | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetObjectRetention                 | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetObjectRetention                 | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetObjectRetention                 | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetObjectRetention                 | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetObjectRetention                 | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetObjectRetention                 | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObjectRetention                 | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObjectRetention                 | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetObjectRetention                 | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetObjectRetention                 | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetObjectRetention                 | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetObjectRetention                 | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetObjectRetention                 | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetBucketTagging                   | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketTagging                   | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetBucketTagging                   | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketTagging                   | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketTagging                   | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetBucketTagging                   | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetBucketTagging                   | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetBucketTagging                   | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetBucketTagging                   | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetBucketTagging                   | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetBucketTagging                   | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetBucketTagging                   | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetBucketTagging                   | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetBucketTagging                   | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetBucketTagging                   | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetBucketTagging                   | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetBucketTagging                   | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetBucketTagging                   | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetBucketTagging                   | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetBucketTagging                   | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetObjectTagging                   | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetObjectTagging                   | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetObjectTagging                   | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObjectTagging                   | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObjectTagging                   | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetObjectTagging                   | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetObjectTagging                   | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetObjectTagging                   | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetObjectTagging                   | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetObjectTagging                   | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetObjectTagging                   | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetObjectTagging                   | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetObjectTagging                   | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObjectTagging                   | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObjectTagging                   | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetObjectTagging                   | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetObjectTagging                   | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetObjectTagging                   | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetObjectTagging                   | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetObjectTagging                   | non-existing       |                     |                    | non-existing    |                  |                 |
            | HeadBucket                         | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | HeadBucket                         | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | HeadBucket                         | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | HeadBucket                         | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | HeadBucket                         | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | HeadBucket                         | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | HeadBucket                         | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | HeadBucket                         | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | HeadBucket                         | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | HeadBucket                         | existing           | applies             | DENY               | non-existing    |                  |                 |
            | HeadBucket                         | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | HeadBucket                         | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | HeadBucket                         | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | HeadBucket                         | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | HeadBucket                         | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | HeadBucket                         | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | HeadBucket                         | non-existing       |                     |                    | existing        | applies          | DENY            |
            | HeadBucket                         | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | HeadBucket                         | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | HeadBucket                         | non-existing       |                     |                    | non-existing    |                  |                 |
            | HeadObject                         | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | HeadObject                         | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | HeadObject                         | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | HeadObject                         | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | HeadObject                         | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | HeadObject                         | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | HeadObject                         | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | HeadObject                         | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | HeadObject                         | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | HeadObject                         | existing           | applies             | DENY               | non-existing    |                  |                 |
            | HeadObject                         | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | HeadObject                         | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | HeadObject                         | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | HeadObject                         | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | HeadObject                         | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | HeadObject                         | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | HeadObject                         | non-existing       |                     |                    | existing        | applies          | DENY            |
            | HeadObject                         | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | HeadObject                         | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | HeadObject                         | non-existing       |                     |                    | non-existing    |                  |                 |
            | ListMultipartUploads               | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | ListMultipartUploads               | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | ListMultipartUploads               | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | ListMultipartUploads               | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | ListMultipartUploads               | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | ListMultipartUploads               | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | ListMultipartUploads               | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | ListMultipartUploads               | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | ListMultipartUploads               | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | ListMultipartUploads               | existing           | applies             | DENY               | non-existing    |                  |                 |
            | ListMultipartUploads               | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | ListMultipartUploads               | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | ListMultipartUploads               | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | ListMultipartUploads               | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | ListMultipartUploads               | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | ListMultipartUploads               | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | ListMultipartUploads               | non-existing       |                     |                    | existing        | applies          | DENY            |
            | ListMultipartUploads               | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | ListMultipartUploads               | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | ListMultipartUploads               | non-existing       |                     |                    | non-existing    |                  |                 |
            | ListObjectVersions                 | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | ListObjectVersions                 | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | ListObjectVersions                 | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | ListObjectVersions                 | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | ListObjectVersions                 | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | ListObjectVersions                 | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | ListObjectVersions                 | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | ListObjectVersions                 | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | ListObjectVersions                 | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | ListObjectVersions                 | existing           | applies             | DENY               | non-existing    |                  |                 |
            | ListObjectVersions                 | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | ListObjectVersions                 | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | ListObjectVersions                 | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | ListObjectVersions                 | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | ListObjectVersions                 | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | ListObjectVersions                 | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | ListObjectVersions                 | non-existing       |                     |                    | existing        | applies          | DENY            |
            | ListObjectVersions                 | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | ListObjectVersions                 | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | ListObjectVersions                 | non-existing       |                     |                    | non-existing    |                  |                 |
            | ListObjects                        | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | ListObjects                        | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | ListObjects                        | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | ListObjects                        | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | ListObjects                        | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | ListObjects                        | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | ListObjects                        | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | ListObjects                        | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | ListObjects                        | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | ListObjects                        | existing           | applies             | DENY               | non-existing    |                  |                 |
            | ListObjects                        | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | ListObjects                        | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | ListObjects                        | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | ListObjects                        | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | ListObjects                        | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | ListObjects                        | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | ListObjects                        | non-existing       |                     |                    | existing        | applies          | DENY            |
            | ListObjects                        | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | ListObjects                        | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | ListObjects                        | non-existing       |                     |                    | non-existing    |                  |                 |
            | ListObjectsV2                      | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | ListObjectsV2                      | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | ListObjectsV2                      | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | ListObjectsV2                      | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | ListObjectsV2                      | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | ListObjectsV2                      | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | ListObjectsV2                      | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | ListObjectsV2                      | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | ListObjectsV2                      | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | ListObjectsV2                      | existing           | applies             | DENY               | non-existing    |                  |                 |
            | ListObjectsV2                      | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | ListObjectsV2                      | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | ListObjectsV2                      | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | ListObjectsV2                      | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | ListObjectsV2                      | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | ListObjectsV2                      | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | ListObjectsV2                      | non-existing       |                     |                    | existing        | applies          | DENY            |
            | ListObjectsV2                      | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | ListObjectsV2                      | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | ListObjectsV2                      | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutBucketAcl                       | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketAcl                       | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutBucketAcl                       | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketAcl                       | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketAcl                       | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutBucketAcl                       | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutBucketAcl                       | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutBucketAcl                       | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutBucketAcl                       | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutBucketAcl                       | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutBucketAcl                       | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketAcl                       | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutBucketAcl                       | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketAcl                       | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketAcl                       | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutBucketAcl                       | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutBucketAcl                       | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutBucketAcl                       | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutBucketAcl                       | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutBucketAcl                       | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutBucketCors                      | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketCors                      | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutBucketCors                      | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketCors                      | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketCors                      | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutBucketCors                      | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutBucketCors                      | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutBucketCors                      | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutBucketCors                      | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutBucketCors                      | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutBucketCors                      | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketCors                      | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutBucketCors                      | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketCors                      | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketCors                      | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutBucketCors                      | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutBucketCors                      | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutBucketCors                      | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutBucketCors                      | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutBucketCors                      | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutBucketEncryption                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketEncryption                | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutBucketEncryption                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketEncryption                | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketEncryption                | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutBucketEncryption                | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutBucketEncryption                | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutBucketEncryption                | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutBucketEncryption                | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutBucketEncryption                | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutBucketEncryption                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketEncryption                | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutBucketEncryption                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketEncryption                | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketEncryption                | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutBucketEncryption                | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutBucketEncryption                | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutBucketEncryption                | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutBucketEncryption                | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutBucketEncryption                | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutBucketLifecycleConfiguration    | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketLifecycleConfiguration    | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutBucketLifecycleConfiguration    | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketLifecycleConfiguration    | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketLifecycleConfiguration    | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutBucketLifecycleConfiguration    | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutBucketLifecycleConfiguration    | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutBucketLifecycleConfiguration    | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutBucketLifecycleConfiguration    | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutBucketLifecycleConfiguration    | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutBucketLifecycleConfiguration    | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketLifecycleConfiguration    | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutBucketLifecycleConfiguration    | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketLifecycleConfiguration    | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketLifecycleConfiguration    | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutBucketLifecycleConfiguration    | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutBucketLifecycleConfiguration    | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutBucketLifecycleConfiguration    | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutBucketLifecycleConfiguration    | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutBucketLifecycleConfiguration    | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutBucketNotificationConfiguration | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketNotificationConfiguration | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutBucketNotificationConfiguration | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketNotificationConfiguration | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketNotificationConfiguration | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutBucketNotificationConfiguration | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutBucketNotificationConfiguration | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutBucketNotificationConfiguration | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutBucketNotificationConfiguration | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutBucketNotificationConfiguration | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutBucketNotificationConfiguration | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketNotificationConfiguration | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutBucketNotificationConfiguration | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketNotificationConfiguration | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketNotificationConfiguration | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutBucketNotificationConfiguration | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutBucketNotificationConfiguration | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutBucketNotificationConfiguration | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutBucketNotificationConfiguration | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutBucketNotificationConfiguration | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutBucketPolicy                    | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketPolicy                    | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutBucketPolicy                    | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketPolicy                    | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketPolicy                    | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutBucketPolicy                    | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutBucketPolicy                    | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutBucketPolicy                    | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutBucketPolicy                    | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutBucketPolicy                    | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutBucketPolicy                    | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketPolicy                    | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutBucketPolicy                    | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketPolicy                    | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketPolicy                    | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutBucketPolicy                    | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutBucketPolicy                    | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutBucketPolicy                    | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutBucketPolicy                    | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutBucketPolicy                    | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutBucketReplication               | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketReplication               | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutBucketReplication               | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketReplication               | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketReplication               | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutBucketReplication               | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutBucketReplication               | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutBucketReplication               | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutBucketReplication               | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutBucketReplication               | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutBucketReplication               | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketReplication               | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutBucketReplication               | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketReplication               | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketReplication               | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutBucketReplication               | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutBucketReplication               | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutBucketReplication               | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutBucketReplication               | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutBucketReplication               | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutBucketVersioning                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketVersioning                | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutBucketVersioning                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketVersioning                | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketVersioning                | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutBucketVersioning                | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutBucketVersioning                | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutBucketVersioning                | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutBucketVersioning                | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutBucketVersioning                | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutBucketVersioning                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketVersioning                | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutBucketVersioning                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketVersioning                | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketVersioning                | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutBucketVersioning                | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutBucketVersioning                | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutBucketVersioning                | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutBucketVersioning                | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutBucketVersioning                | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutObject                          | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutObject                          | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutObject                          | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObject                          | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObject                          | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutObject                          | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutObject                          | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutObject                          | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutObject                          | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutObject                          | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutObject                          | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutObject                          | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutObject                          | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObject                          | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObject                          | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutObject                          | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutObject                          | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutObject                          | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutObject                          | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutObject                          | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutObjectAcl                       | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectAcl                       | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutObjectAcl                       | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectAcl                       | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectAcl                       | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutObjectAcl                       | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutObjectAcl                       | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutObjectAcl                       | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutObjectAcl                       | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutObjectAcl                       | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutObjectAcl                       | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectAcl                       | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutObjectAcl                       | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectAcl                       | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectAcl                       | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutObjectAcl                       | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutObjectAcl                       | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutObjectAcl                       | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutObjectAcl                       | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutObjectAcl                       | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutObjectLegalHold                 | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectLegalHold                 | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutObjectLegalHold                 | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectLegalHold                 | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectLegalHold                 | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutObjectLegalHold                 | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutObjectLegalHold                 | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutObjectLegalHold                 | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutObjectLegalHold                 | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutObjectLegalHold                 | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutObjectLegalHold                 | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectLegalHold                 | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutObjectLegalHold                 | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectLegalHold                 | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectLegalHold                 | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutObjectLegalHold                 | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutObjectLegalHold                 | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutObjectLegalHold                 | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutObjectLegalHold                 | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutObjectLegalHold                 | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutObjectLockConfiguration         | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectLockConfiguration         | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutObjectLockConfiguration         | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectLockConfiguration         | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectLockConfiguration         | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutObjectLockConfiguration         | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutObjectLockConfiguration         | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutObjectLockConfiguration         | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutObjectLockConfiguration         | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutObjectLockConfiguration         | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutObjectLockConfiguration         | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectLockConfiguration         | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutObjectLockConfiguration         | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectLockConfiguration         | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectLockConfiguration         | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutObjectLockConfiguration         | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutObjectLockConfiguration         | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutObjectLockConfiguration         | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutObjectLockConfiguration         | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutObjectLockConfiguration         | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutObjectRetention                 | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectRetention                 | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutObjectRetention                 | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectRetention                 | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectRetention                 | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutObjectRetention                 | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutObjectRetention                 | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutObjectRetention                 | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutObjectRetention                 | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutObjectRetention                 | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutObjectRetention                 | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectRetention                 | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutObjectRetention                 | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectRetention                 | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectRetention                 | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutObjectRetention                 | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutObjectRetention                 | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutObjectRetention                 | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutObjectRetention                 | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutObjectRetention                 | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutBucketTagging                   | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketTagging                   | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutBucketTagging                   | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketTagging                   | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketTagging                   | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutBucketTagging                   | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutBucketTagging                   | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutBucketTagging                   | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutBucketTagging                   | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutBucketTagging                   | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutBucketTagging                   | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutBucketTagging                   | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutBucketTagging                   | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutBucketTagging                   | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutBucketTagging                   | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutBucketTagging                   | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutBucketTagging                   | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutBucketTagging                   | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutBucketTagging                   | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutBucketTagging                   | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutObjectTagging                   | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectTagging                   | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutObjectTagging                   | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectTagging                   | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectTagging                   | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutObjectTagging                   | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutObjectTagging                   | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutObjectTagging                   | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutObjectTagging                   | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutObjectTagging                   | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutObjectTagging                   | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectTagging                   | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutObjectTagging                   | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectTagging                   | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectTagging                   | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutObjectTagging                   | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutObjectTagging                   | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutObjectTagging                   | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutObjectTagging                   | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutObjectTagging                   | non-existing       |                     |                    | non-existing    |                  |                 |
            | UploadPart                         | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | UploadPart                         | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | UploadPart                         | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | UploadPart                         | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | UploadPart                         | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | UploadPart                         | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | UploadPart                         | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | UploadPart                         | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | UploadPart                         | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | UploadPart                         | existing           | applies             | DENY               | non-existing    |                  |                 |
            | UploadPart                         | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | UploadPart                         | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | UploadPart                         | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | UploadPart                         | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | UploadPart                         | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | UploadPart                         | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | UploadPart                         | non-existing       |                     |                    | existing        | applies          | DENY            |
            | UploadPart                         | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | UploadPart                         | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | UploadPart                         | non-existing       |                     |                    | non-existing    |                  |                 |
            | UploadPartCopy                     | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | UploadPartCopy                     | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | UploadPartCopy                     | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | UploadPartCopy                     | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | UploadPartCopy                     | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | UploadPartCopy                     | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | UploadPartCopy                     | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | UploadPartCopy                     | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | UploadPartCopy                     | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | UploadPartCopy                     | existing           | applies             | DENY               | non-existing    |                  |                 |
            | UploadPartCopy                     | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | UploadPartCopy                     | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | UploadPartCopy                     | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | UploadPartCopy                     | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | UploadPartCopy                     | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | UploadPartCopy                     | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | UploadPartCopy                     | non-existing       |                     |                    | existing        | applies          | DENY            |
            | UploadPartCopy                     | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | UploadPartCopy                     | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | UploadPartCopy                     | non-existing       |                     |                    | non-existing    |                  |                 |
            | DeleteObjectVersion                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteObjectVersion                | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | DeleteObjectVersion                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteObjectVersion                | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteObjectVersion                | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | DeleteObjectVersion                | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | DeleteObjectVersion                | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | DeleteObjectVersion                | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | DeleteObjectVersion                | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | DeleteObjectVersion                | existing           | applies             | DENY               | non-existing    |                  |                 |
            | DeleteObjectVersion                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteObjectVersion                | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | DeleteObjectVersion                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteObjectVersion                | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteObjectVersion                | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | DeleteObjectVersion                | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | DeleteObjectVersion                | non-existing       |                     |                    | existing        | applies          | DENY            |
            | DeleteObjectVersion                | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | DeleteObjectVersion                | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | DeleteObjectVersion                | non-existing       |                     |                    | non-existing    |                  |                 |
            | DeleteObjectVersionTagging         | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteObjectVersionTagging         | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | DeleteObjectVersionTagging         | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteObjectVersionTagging         | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteObjectVersionTagging         | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | DeleteObjectVersionTagging         | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | DeleteObjectVersionTagging         | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | DeleteObjectVersionTagging         | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | DeleteObjectVersionTagging         | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | DeleteObjectVersionTagging         | existing           | applies             | DENY               | non-existing    |                  |                 |
            | DeleteObjectVersionTagging         | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | DeleteObjectVersionTagging         | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | DeleteObjectVersionTagging         | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | DeleteObjectVersionTagging         | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | DeleteObjectVersionTagging         | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | DeleteObjectVersionTagging         | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | DeleteObjectVersionTagging         | non-existing       |                     |                    | existing        | applies          | DENY            |
            | DeleteObjectVersionTagging         | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | DeleteObjectVersionTagging         | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | DeleteObjectVersionTagging         | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetObjectVersion                   | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetObjectVersion                   | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetObjectVersion                   | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObjectVersion                   | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObjectVersion                   | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetObjectVersion                   | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetObjectVersion                   | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetObjectVersion                   | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetObjectVersion                   | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetObjectVersion                   | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetObjectVersion                   | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetObjectVersion                   | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetObjectVersion                   | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObjectVersion                   | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObjectVersion                   | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetObjectVersion                   | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetObjectVersion                   | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetObjectVersion                   | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetObjectVersion                   | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetObjectVersion                   | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetObjectVersionAcl                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetObjectVersionAcl                | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetObjectVersionAcl                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObjectVersionAcl                | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObjectVersionAcl                | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetObjectVersionAcl                | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetObjectVersionAcl                | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetObjectVersionAcl                | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetObjectVersionAcl                | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetObjectVersionAcl                | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetObjectVersionAcl                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetObjectVersionAcl                | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetObjectVersionAcl                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObjectVersionAcl                | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObjectVersionAcl                | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetObjectVersionAcl                | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetObjectVersionAcl                | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetObjectVersionAcl                | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetObjectVersionAcl                | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetObjectVersionAcl                | non-existing       |                     |                    | non-existing    |                  |                 |
            | GetObjectVersionTagging            | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | GetObjectVersionTagging            | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | GetObjectVersionTagging            | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObjectVersionTagging            | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObjectVersionTagging            | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | GetObjectVersionTagging            | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | GetObjectVersionTagging            | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | GetObjectVersionTagging            | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | GetObjectVersionTagging            | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | GetObjectVersionTagging            | existing           | applies             | DENY               | non-existing    |                  |                 |
            | GetObjectVersionTagging            | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | GetObjectVersionTagging            | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | GetObjectVersionTagging            | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | GetObjectVersionTagging            | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | GetObjectVersionTagging            | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | GetObjectVersionTagging            | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | GetObjectVersionTagging            | non-existing       |                     |                    | existing        | applies          | DENY            |
            | GetObjectVersionTagging            | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | GetObjectVersionTagging            | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | GetObjectVersionTagging            | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutObjectVersionAcl                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectVersionAcl                | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutObjectVersionAcl                | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectVersionAcl                | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectVersionAcl                | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutObjectVersionAcl                | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutObjectVersionAcl                | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutObjectVersionAcl                | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutObjectVersionAcl                | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutObjectVersionAcl                | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutObjectVersionAcl                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectVersionAcl                | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutObjectVersionAcl                | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectVersionAcl                | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectVersionAcl                | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutObjectVersionAcl                | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutObjectVersionAcl                | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutObjectVersionAcl                | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutObjectVersionAcl                | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutObjectVersionAcl                | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutObjectVersionTagging            | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectVersionTagging            | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutObjectVersionTagging            | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectVersionTagging            | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectVersionTagging            | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutObjectVersionTagging            | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutObjectVersionTagging            | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutObjectVersionTagging            | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutObjectVersionTagging            | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutObjectVersionTagging            | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutObjectVersionTagging            | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectVersionTagging            | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutObjectVersionTagging            | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectVersionTagging            | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectVersionTagging            | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutObjectVersionTagging            | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutObjectVersionTagging            | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutObjectVersionTagging            | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutObjectVersionTagging            | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutObjectVersionTagging            | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutObjectVersionRetention          | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectVersionRetention          | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutObjectVersionRetention          | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectVersionRetention          | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectVersionRetention          | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutObjectVersionRetention          | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutObjectVersionRetention          | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutObjectVersionRetention          | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutObjectVersionRetention          | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutObjectVersionRetention          | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutObjectVersionRetention          | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectVersionRetention          | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutObjectVersionRetention          | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectVersionRetention          | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectVersionRetention          | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutObjectVersionRetention          | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutObjectVersionRetention          | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutObjectVersionRetention          | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutObjectVersionRetention          | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutObjectVersionRetention          | non-existing       |                     |                    | non-existing    |                  |                 |
            | PutObjectVersionLegalHold          | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectVersionLegalHold          | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | PutObjectVersionLegalHold          | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectVersionLegalHold          | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectVersionLegalHold          | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | PutObjectVersionLegalHold          | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | PutObjectVersionLegalHold          | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | PutObjectVersionLegalHold          | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | PutObjectVersionLegalHold          | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | PutObjectVersionLegalHold          | existing           | applies             | DENY               | non-existing    |                  |                 |
            | PutObjectVersionLegalHold          | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | PutObjectVersionLegalHold          | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | PutObjectVersionLegalHold          | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | PutObjectVersionLegalHold          | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | PutObjectVersionLegalHold          | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | PutObjectVersionLegalHold          | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | PutObjectVersionLegalHold          | non-existing       |                     |                    | existing        | applies          | DENY            |
            | PutObjectVersionLegalHold          | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | PutObjectVersionLegalHold          | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | PutObjectVersionLegalHold          | non-existing       |                     |                    | non-existing    |                  |                 |
            | MetadataSearch                     | existing           | applies             | ALLOW              | existing        | applies          | ALLOW           |
            | MetadataSearch                     | existing           | applies             | ALLOW              | existing        | applies          | DENY            |
            | MetadataSearch                     | existing           | applies             | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | MetadataSearch                     | existing           | applies             | ALLOW              | existing        | does not apply   | ALLOW           |
            | MetadataSearch                     | existing           | applies             | ALLOW              | non-existing    |                  |                 |
            | MetadataSearch                     | existing           | applies             | DENY               | existing        | applies          | ALLOW           |
            | MetadataSearch                     | existing           | applies             | DENY               | existing        | applies          | DENY            |
            | MetadataSearch                     | existing           | applies             | DENY               | existing        | applies          | ALLOW+DENY      |
            | MetadataSearch                     | existing           | applies             | DENY               | existing        | does not apply   | ALLOW           |
            | MetadataSearch                     | existing           | applies             | DENY               | non-existing    |                  |                 |
            | MetadataSearch                     | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW           |
            | MetadataSearch                     | existing           | does not apply      | ALLOW              | existing        | applies          | DENY            |
            | MetadataSearch                     | existing           | does not apply      | ALLOW              | existing        | applies          | ALLOW+DENY      |
            | MetadataSearch                     | existing           | does not apply      | ALLOW              | existing        | does not apply   | ALLOW           |
            | MetadataSearch                     | existing           | does not apply      | ALLOW              | non-existing    |                  |                 |
            | MetadataSearch                     | non-existing       |                     |                    | existing        | applies          | ALLOW           |
            | MetadataSearch                     | non-existing       |                     |                    | existing        | applies          | DENY            |
            | MetadataSearch                     | non-existing       |                     |                    | existing        | applies          | ALLOW+DENY      |
            | MetadataSearch                     | non-existing       |                     |                    | existing        | does not apply   | ALLOW           |
            | MetadataSearch                     | non-existing       |                     |                    | non-existing    |                  |                 |
