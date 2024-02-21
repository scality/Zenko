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
