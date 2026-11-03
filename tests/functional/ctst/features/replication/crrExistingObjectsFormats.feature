Feature: Replication of existing objects across rule formats and metadata formats
    crrExistingObjects.js (s3utils) rewrites the replicationInfo of existing
    objects so backbeat replicates them. Whatever the rule format (V1 Prefix,
    V2 Filter) and whatever format the object metadata had before the run,
    what it writes must replicate, and must be what cloudserver writes for
    a PUT in the same bucket (ZENKO-5391, S3UTILS-256, S3UTILS-257).
    Each scenario targets one issue.

    @2.16.0
    @PreMerge
    @ReplicationTest
    # S3C-11596: with V2 rules the script set the top-level status to
    # PROCESSING, so backbeat never queued the object.
    Scenario: Existing object with V2 rules replicates
        Given an existing bucket "crr-existing-v2" "with" versioning, "without" ObjectLock "without" retention mode
        And an object "existing-v2" that "exists"
        And a valid multi-destination replication configuration with rules:
            | id | prefix | priority | location           |
            | r1 |        | 1        | awsbackendmismatch |
        When the job to replicate existing objects with status "NEW" is executed
        Then the object replication should "succeed" within 300 seconds
        And the replicated object should match the source on every configured destination

    @2.16.0
    @PreMerge
    @ReplicationTest
    # S3C-11599: with V1 rules the script wrote backends without bucket and
    # role, and backbeat failed with BadRole on CRR destinations.
    Scenario: Existing object with V1 rules replicates to a CRR location
        Given CRR replication accounts are registered
        And a versioned bucket exists in location "crr-location-a"
        And a versioned bucket exists in location "crr-location-b"
        And an existing bucket "crr-existing-v1-crr" "with" versioning, "without" ObjectLock "without" retention mode
        And an object "existing-v1-crr" that "exists"
        And a valid multi-destination replication configuration with rules:
            | id | prefix | location       |
            | r1 |        | crr-location-a |
        When the job to replicate existing objects with status "NEW" is executed
        Then the object replication should "succeed" within 300 seconds
        And the replicated object on "crr-location-a" should match the source

    @2.16.0
    @PreMerge
    @ReplicationTest
    # SITE_NAME targets one destination: the other destination of the object
    # must keep its status and dataStoreVersionId.
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
    # S3UTILS-257: objects written before Zenko 2.16 (top-level destination/
    # role/storageClass/storageType) must come out of a requeue in the format
    # cloudserver writes today, without destination/role on cloud backends.
    Scenario: Requeue of an object with pre-2.16 replication metadata
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
    # Cascade backfill: B holds replicas from A written before Zenko 2.16
    # (status REPLICA, no isReplica flag). A B -> C rule is added and the
    # script is run on B. The object must reach C, and stay a replica on B
    # (x-amz-replication-status REPLICA, checked by the settle step).
    Scenario: Existing pre-2.16 replicas are replicated further and stay replicas
        Given CRR replication accounts are registered
        And a versioned bucket exists in location "crr-location-a"
        And a versioned bucket exists in location "crr-location-b"
        And a versioned bucket exists in location "crr-location-c"
        And replication is configured from location "crr-location-a" to "crr-location-b"
        And an object "backfill-legacy-replica" of 42 bytes is put in location "crr-location-a"
        And the object should replicate to location "crr-location-b" within 280 seconds
        And the replica at location "crr-location-b" has pre-2.16 replica metadata
        And replication is configured from location "crr-location-b" to "crr-location-c"
        When the job to replicate existing objects with status "NEW" is executed on location "crr-location-b" for site "crr-location-c"
        Then the object should replicate to location "crr-location-c" within 280 seconds
        And the cascade replication states should settle within 120 seconds
