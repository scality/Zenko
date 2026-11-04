Feature: Replication
    This feature tests replication using the script crrExistingObjects.js from S3utils,
    that replicates objects created before the replication was enabled on source the bucket.

    @2.12.0
    @PreMerge
    @ReplicationTest
    Scenario Outline: Replicate objects created before creating the replication rule
        Given an existing bucket "source-bucket-1" "with" versioning, "without" ObjectLock "without" retention mode
        And an object "source-object-1" that "exists"
        And a replication configuration to "awsbackendmismatch" location
        Then the object replication should "never happen" within 30 seconds
        When the job to replicate existing objects with status "NEW" is executed
        Then the object replication should "succeed" within 300 seconds
        And the replicated object should match the source on every configured destination

    @2.12.0
    @PreMerge
    @ReplicationTest
    @Lockawsbackendreplicationctstfail
    Scenario Outline: Re-replicate objects that failed to replicate
        Given an existing bucket "source-bucket2" "with" versioning, "without" ObjectLock "without" retention mode
        And a replication configuration to "awsbackendreplicationctstfail" location
        And a deleted destination bucket on that location
        And an object "source-object-2" that "exists"
        Then the object replication should "fail" within 500 seconds
        When the destination bucket on the location is created again
        And the job to replicate existing objects with status "FAILED" is executed
        Then the object replication should "succeed" within 300 seconds
        And the replicated object should match the source on every configured destination

    @2.16.0
    @PreMerge
    @ReplicationTest
    Scenario: Existing object with V2 rules replicates
        Given an existing bucket "crr-existing-v2" "with" versioning, "without" ObjectLock "without" retention mode
        And an object "existing-v2" that "exists"
        And a valid multi-destination replication configuration with rules:
            | id | prefix | priority | location           |
            | r1 |        | 1        | awsbackendmismatch |
        And getBucketReplication should return a "V2" configuration with 1 rules
        When the job to replicate existing objects with status "NEW" is executed
        Then the object replication should "succeed" within 300 seconds
        And the replicated object should match the source on every configured destination

    @2.16.0
    @PreMerge
    @ReplicationTest
    Scenario: Requeue to one new location leaves the other location untouched
        Given an existing bucket "crr-existing-multi" "with" versioning, "without" ObjectLock "without" retention mode
        And a replication configuration to "awsbackendmismatch" location
        And an object "existing-multi" that "exists"
        And the object replication should "succeed" within 300 seconds
        And the replication info of the object is saved
        And a valid multi-destination replication configuration with rules:
            | id | prefix | priority | location           |
            | r1 |        | 1        | awsbackendmismatch |
            | r2 |        | 2        | awsbackend         |
        When the job to replicate existing objects with status "NEW" is executed for site "awsbackend"
        Then the object replication should "succeed" within 300 seconds
        And the replicated object on "awsbackend" should match the source
        And the "awsbackendmismatch" backend of the object should be unchanged

    @2.16.0
    @PreMerge
    @ReplicationTest
    Scenario: Requeue of an object with pre-2.16 replication metadata to a cloud location
        Given an existing bucket "crr-existing-legacy-md" "with" versioning, "without" ObjectLock "without" retention mode
        And a replication configuration to "awsbackendmismatch" location
        And an object "existing-legacy-md" that "exists"
        And the object replication should "succeed" within 300 seconds
        And the object replication info is rewritten in the pre-2.16 format with status "FAILED"
        When the job to replicate existing objects with status "FAILED" is executed
        Then the object replication should "succeed" within 300 seconds
        And the replicated object should match the source on every configured destination
        And the object replication info should match what cloudserver writes for a new object

    @2.16.0
    @PreMerge
    @ReplicationTest
    @CRRCascade
    Scenario: Existing replicas are replicated further and stay replicas
        Given CRR replication accounts are registered
        And a versioned bucket exists in location "crr-location-a"
        And a versioned bucket exists in location "crr-location-b"
        And a versioned bucket exists in location "crr-location-c"
        And replication is configured from location "crr-location-a" to "crr-location-b"
        And an object "backfill-replica" of 42 bytes is put in location "crr-location-a"
        And the object should replicate to location "crr-location-b" within 280 seconds
        And replication is configured from location "crr-location-b" to "crr-location-c"
        When the job to replicate existing objects with status "NEW" is executed on location "crr-location-b" for site "crr-location-c"
        Then the object should replicate to location "crr-location-c" within 280 seconds
        And the cascade replication states should settle within 120 seconds
