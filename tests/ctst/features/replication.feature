Feature: Live Object Replication
    This feature tests live replication of objects across different sizes,
    verifying that oplog location stripping does not affect replication
    correctness.

    The objectRefreshSizeThresholdMB is set to 2 in the Zenko CR, meaning
    objects >= 2 MiB have their location stripped from the MongoDB change
    stream event. The replication consumer detects this and re-fetches
    metadata from the source before replicating.

    @2.14.0
    @PreMerge
    @ReplicationTest
    Scenario Outline: Object of <objectDescription> replicates with location stripping threshold
        Given an existing bucket "repl-strip-<sizeBytes>" "with" versioning, "without" ObjectLock "without" retention mode
        And a replication configuration to "awsbackendmismatch" location
        And 1 objects "repl-strip-obj" of size <sizeBytes> bytes
        Then the object replication should "succeed" within 300 seconds
        And the replicated object should be the same as the source object

        Examples:
            | sizeBytes | objectDescription                  |
            |         0 | 0 bytes (zero-byte)                |
            |   1048576 | 1 MiB (below threshold)            |
            |   2097152 | 2 MiB (at threshold, stripped)     |
            |   4194304 | 4 MiB (above threshold, stripped)  |
