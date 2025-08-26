Feature: Replication
    This feature tests replication using the script crrExistingObjects.js from S3utils,
    that replicates objects created before the replication was enabled on source the bucket.

    @2.12.0
    @PreMerge
    @ReplicationTest
    Scenario Outline: Replicate objects created before creating the replication rule
        Given an existing bucket "source-bucket" "with" versioning, "without" ObjectLock "without" retention mode
        And an object "source-object-1" that "exists"
        And a replication configuration to "awsbackendmismatch" location
        When I run the job to replicate existing objects with status "NEW"
        Then the object should eventually be replicated
        And the replicated object should be the same as the source object