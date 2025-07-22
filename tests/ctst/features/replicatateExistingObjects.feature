Feature: Replication
    This feature tests replication using the script crrExistingObjects.js from S3utils,
    that replicates objects created before the replication was enabled on source the bucket.

    @2.7.0
    @PreMerge
    @ReplicationTest
    Scenario Outline: Replicate objects created before creating the replication rule
        Given an existing bucket "<sourceBucket>" "with" versioning, "without" ObjectLock "without" retention mode
        And an object "<sourceObject>" that "exists"
        And a replication configuration from "<sourceBucket>" bucket to "<replicationLocation>" location
        When I run the job to replicate existing objects with status "<sourceObjStatus>" from bucket "<sourceBucket>" to location "<replicationLocation>"
        Then the object "<sourceObject>" should be replicated within 60 seconds from "<sourceBucket>" bucket
        And the replicated object "<sourceObject>" from "<sourceBucket>" bucket to "<replicationBucket>" bucket with location "<replicationLocation>" should be the same as its source object

        Examples:
            | sourceBucket  | sourceObjStatus |                    replicationBucket |    sourceObject |       replicationLocation |
            | source-bucket |             NEW | ci-zenko-aws-replication-ctst-bucket | source-object-1 | awsbackendreplicationctst |
