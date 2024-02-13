# This file was generated using generate.js

Feature: S3 Bucket Policies Authorization flow for Web Identities
    Bucket policies feature should allow the default web identities to
    perform more actions, or be denied on actions they are not allowed to
    perform by default.

    @2.6.0
    @PreMerge
    @BucketPolicies
    @BP-DATA_CONSUMER
    Scenario Outline: "GetObject"
        And an existing bucket prepared for the action
        And a DATA_CONSUMER type
        And an environment setup for the API
        And an "non-existing" IAM Policy that "" with "" effect for the current API
        And an "existing" S3 Bucket Policy that "applies" with "DENY" effect for the current API
        When the user tries to perform the current S3 action on the bucket
        Then the authorization result is correct
