# This file was generated using generate.js

Feature: S3 Bucket Policies Authorization flow for IAM Users
    This feature allows you to create and attach bucket policies to S3 buckets.
    IAM Users should have the permissions to perform the actions that they are granted in their bucket policies
    based on the other permissions they also have.
    This test suite is not meant to be human-readable, but brings confidence in our Authz flow for all supported
    S3 actions.

 # write for cnes