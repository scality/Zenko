Feature: Bucket Replication
    End-to-end coverage of Zenko's bucket replication, covering both
    cloud destinations (AWS / GCP / Azure backends) and CRR loopback
    destinations (replication between Zenko accounts).

    @2.14.0
    @PreMerge
    @ReplicationTest
    # Targets the location-stripping threshold: objectRefreshSizeThresholdMB
    # is set to 2 in the Zenko CR, so objects >= 2 MiB have their location
    # stripped from the MongoDB change stream event. The replication consumer
    # detects this and re-fetches metadata from the source before replicating.
    Scenario Outline: Object of <objectDescription> replicates with location stripping threshold
        Given an existing bucket "repl-strip-<sizeBytes>" "with" versioning, "without" ObjectLock "without" retention mode
        And a replication configuration to "awsbackendmismatch" location
        And 1 objects "repl-strip-obj" of size <sizeBytes> bytes
        Then the object replication should "succeed" within 300 seconds
        And the replicated object should match the source on every configured destination

        Examples:
            | sizeBytes | objectDescription                  |
            |         0 | 0 bytes (zero-byte)                |
            |   1048576 | 1 MiB (below threshold)            |
            |   2097152 | 2 MiB (at threshold, stripped)     |
            |   4194304 | 4 MiB (above threshold, stripped)  |

    @2.16.0
    @PreMerge
    @ReplicationTest
    # Multi-destination replication: a single replication configuration
    # carries several rules targeting distinct destinations, optionally with
    # overlapping prefixes resolved by Priority. The legacy V1 format and
    # the non-standard comma-separated StorageClass form remain supported
    # for backward compatibility and round-trip unchanged through
    # getBucketReplication.
    Scenario: V2 replication fans out to two cloud destinations
        Given an existing bucket "multi-cloud-2" "with" versioning, "without" ObjectLock "without" retention mode
        And a valid multi-destination replication configuration with rules:
            | id     | prefix | priority | location              |
            | rule-a |        | 1        | awsbackendmismatch    |
            | rule-b |        | 2        | awsbackend    |
        And 1 objects "multi-cloud-obj" of size 1024 bytes
        Then the object replication should "succeed" within 300 seconds
        And the replicated object should match the source on every configured destination

    @2.16.0
    @PreMerge
    @ReplicationTest
    Scenario: V2 replication fans out to a mix of cloud and CRR destinations
        Given CRR replication accounts are registered
        And a versioned bucket exists in location "crr-location-a"
        And a versioned bucket exists in location "crr-location-b"
        And an existing bucket "multi-fanout" "with" versioning, "without" ObjectLock "without" retention mode
        And a valid multi-destination replication configuration with rules:
            | id     | prefix | priority | location           |
            | rule-a |        | 1        | awsbackendmismatch |
            | rule-b |        | 2        | awsbackend         |
            | rule-c |        | 3        | crr-location-a     |
            | rule-d |        | 4        | crr-location-b     |
        And 1 objects "multi-fanout-obj" of size 1024 bytes
        Then the object replication should "succeed" within 300 seconds
        And the replicated object should match the source on every configured destination

    @2.16.0
    @PreMerge
    @ReplicationTest
    Scenario: CRR + cloud mixed destination replication
        Given CRR replication accounts are registered
        And a versioned bucket exists in location "crr-location-a"
        And an existing bucket "multi-mixed" "with" versioning, "without" ObjectLock "without" retention mode
        And a valid multi-destination replication configuration with rules:
            | id     | prefix | priority | location                  |
            | rule-c |        | 1        | crr-location-a    |
            | rule-x |        | 2        | awsbackendmismatch        |
        And 1 objects "mixed-obj" of size 1024 bytes
        Then the object replication should "succeed" within 300 seconds
        And the replicated object should match the source on every configured destination

    @2.16.0
    @PreMerge
    @ReplicationTest
    Scenario: V2 rules with overlapping prefixes to different destinations all apply
        Given an existing bucket "multi-overlap" "with" versioning, "without" ObjectLock "without" retention mode
        And a valid multi-destination replication configuration with rules:
            | id     | prefix | priority | location              |
            | broad  |        | 1        | awsbackendmismatch    |
            | narrow | docs-  | 2        | awsbackend            |
        And 1 objects "docs-report" of size 1024 bytes
        Then the object replication should "succeed" within 300 seconds
        And the replicated object should match the source on every configured destination

    @2.16.0
    @PreMerge
    @ReplicationTest
    Scenario: Disabled rule does not replicate
        Given an existing bucket "multi-disabled" "with" versioning, "without" ObjectLock "without" retention mode
        And a valid multi-destination replication configuration with rules:
            | id     | prefix | priority | status   | location              |
            | active |        | 1        | Enabled  | awsbackendmismatch    |
            | off    |        | 2        | Disabled | awsbackend    |
        And 1 objects "disabled-obj" of size 1024 bytes
        Then the object replication should "succeed" within 300 seconds
        And the object should not be replicated to "awsbackend"
        And the replicated object on "awsbackendmismatch" should match the source

    @2.16.0
    @PreMerge
    @ReplicationTest
    Scenario: Overlap on same destination without distinct priorities is rejected
        Given an existing bucket "multi-bad-overlap" "with" versioning, "without" ObjectLock "without" retention mode
        And an invalid multi-destination replication configuration with rules:
            | id    | prefix | priority | location              |
            | dup-a |        | 1        | awsbackendmismatch    |
            | dup-b | docs-| 1        | awsbackendmismatch    |
        Then the replication configuration request should be rejected with "InvalidRequest"

    @2.16.0
    @PreMerge
    @ReplicationTest
    Scenario: Same destination overlap with distinct priorities is accepted
        Given an existing bucket "multi-priority-dedup" "with" versioning, "without" ObjectLock "without" retention mode
        And a valid multi-destination replication configuration with rules:
            | id    | prefix | priority | location              |
            | lo    |        | 1        | awsbackendmismatch    |
            | hi    | docs-| 2        | awsbackendmismatch    |
        And 1 objects "docs-winner" of size 1024 bytes
        Then the object replication should "succeed" within 300 seconds
        And the replicated object on "awsbackendmismatch" should match the source

    @2.16.0
    @PreMerge
    @ReplicationTest
    Scenario: V1 configuration replicates and round-trips through getBucketReplication
        Given an existing bucket "multi-v1-compat" "with" versioning, "without" ObjectLock "without" retention mode
        And a valid multi-destination replication configuration with rules:
            | id      | prefix | location              |
            | v1-only |        | awsbackendmismatch    |
        And 1 objects "v1-obj" of size 1024 bytes
        Then the object replication should "succeed" within 300 seconds
        And the replicated object on "awsbackendmismatch" should match the source
        And getBucketReplication should return a "V1" configuration with 1 rules

    @2.16.0
    @PreMerge
    @ReplicationTest
    Scenario: Legacy comma-separated StorageClass replicates to multiple sites
        Given an existing bucket "multi-legacy-comma" "with" versioning, "without" ObjectLock "without" retention mode
        And a legacy comma-StorageClass replication configuration to locations "awsbackendmismatch,awsbackend"
        And 1 objects "legacy-obj" of size 1024 bytes
        Then the object replication should "succeed" within 300 seconds
        And the replicated object should match the source on every configured destination
        And getBucketReplication should return a "V1" configuration with 1 rules
        And getBucketReplication rule 0 should have StorageClass "awsbackendmismatch,awsbackend"

    @2.16.0
    @PreMerge
    @ReplicationTest
    Scenario: Two CRR destinations replicate independently
        Given CRR replication accounts are registered
        And a versioned bucket exists in location "crr-location-a"
        And a versioned bucket exists in location "crr-location-b"
        And an existing bucket "multi-crr-pair" "with" versioning, "without" ObjectLock "without" retention mode
        And a valid multi-destination replication configuration with rules:
            | id     | prefix | priority | location                |
            | crr-a  |        | 1        | crr-location-a  |
            | crr-b  |        | 2        | crr-location-b  |
        And 1 objects "crr-pair-obj" of size 1024 bytes
        Then the object replication should "succeed" within 300 seconds
        And the replicated object on "crr-location-a" should match the source
        And the replicated object on "crr-location-b" should match the source
