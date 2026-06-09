Feature: CRR Cascade Replication

    Cross-Region Replication Cascade allows replication of an object from
    a first location to carry on through multiple locations without
    stopping at first destination.

    @2.16.0
    @PreMerge
    @ReplicationTest
    @CRRCascade
    Scenario: Cascade replication nominal case : A -> B -> C
        Given CRR replication accounts are registered
        And a versioned bucket exists in location "crr-location-a"
        And a versioned bucket exists in location "crr-location-b"
        And a versioned bucket exists in location "crr-location-c"
        And replication is configured from location "crr-location-b" to "crr-location-c"
        And replication is configured from location "crr-location-a" to "crr-location-b"
        When an object "cascade-obj" is put in location "crr-location-a"
        Then the object should replicate to location "crr-location-b" within 300 seconds
        And the object should replicate to location "crr-location-c" within 300 seconds
        When I wait 15 seconds
        Then the cascade replication states should be settled

    @2.16.0
    @PreMerge
    @ReplicationTest
    @CRRCascade
    Scenario: Cascade replication with loop : A -> B -> C -> A
        Given CRR replication accounts are registered
        And a versioned bucket exists in location "crr-location-a"
        And a versioned bucket exists in location "crr-location-b"
        And a versioned bucket exists in location "crr-location-c"
        And replication is configured from location "crr-location-a" to "crr-location-b"
        And replication is configured from location "crr-location-b" to "crr-location-c"
        And replication is configured from location "crr-location-c" to "crr-location-a"
        When an object "cascade-loop-obj" is put in location "crr-location-a"
        Then the object should replicate to location "crr-location-b" within 300 seconds
        And the object should replicate to location "crr-location-c" within 300 seconds
        And the object at location "crr-location-a" should never have replication status PENDING within 30 seconds
        When I wait 15 seconds
        Then the cascade replication states should be settled

    @2.16.0
    @PreMerge
    @ReplicationTest
    @CRRCascade
    Scenario: Multiple writes across a loop converge to the last write
        Given CRR replication accounts are registered
        And a versioned bucket exists in location "crr-location-a"
        And a versioned bucket exists in location "crr-location-b"
        And a versioned bucket exists in location "crr-location-c"
        And replication is configured from location "crr-location-b" to "crr-location-c"
        And replication is configured from location "crr-location-c" to "crr-location-a"
        And replication is configured from location "crr-location-a" to "crr-location-b"
        When the object "cascade-convergence-obj" is concurrently written 10 times to every cascade location
        Then all cascade locations should converge to the same metadata marker within 300 seconds
