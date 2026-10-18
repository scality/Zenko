Feature: Direct to cold
    Objects written with a cold storage class are stored in the hot location, declared cold
    right away, and archived by backbeat from the oplog without any lifecycle rule. Backbeat
    only tails the oplog of buckets with a transition rule, so a disabled one is set on the
    bucket of the scenarios which must not transition anything by themselves.

    @2.16.0
    @PreMerge
    @Dmf
    @ColdStorage
    @DirectToCold
    Scenario Outline: Write an object directly to a cold location
    Given a "<versioningConfiguration>" bucket
    And a disabled transition workflow to "e2e-cold" location
    And 2 objects "obj" of size <objectSize> bytes with storage class "e2e-cold"
    Then object "obj-2" should be awaiting transition to "e2e-cold"
    And i "should" be able to read object "obj-2"
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-cold"
    And object "obj-2" should be "transitioned" and have the storage class "e2e-cold"
    And dmf volume should contain 2 objects
    And i "should not" be able to read object "obj-1"
    And i "should not" be able to read object "obj-2"

    Examples:
    | versioningConfiguration | objectSize |
    |           Non versioned |        100 |
    |               Versioned |        100 |
    |               Suspended |        100 |

    @2.16.0
    @PreMerge
    @Dmf
    @ColdStorage
    @DirectToCold
    Scenario Outline: Write an object directly to a cold location with multipart upload
    Given a "<versioningConfiguration>" bucket
    And a disabled transition workflow to "e2e-cold" location
    And 1 mpu objects "obj" of size <objectSize> bytes with storage class "e2e-cold"
    Then object "obj-1" should be awaiting transition to "e2e-cold"
    And i "should" be able to read object "obj-1"
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-cold"
    And dmf volume should contain 1 objects
    And i "should not" be able to read object "obj-1"

    Examples:
    | versioningConfiguration | objectSize |
    |           Non versioned |        100 |
    |               Versioned |        100 |

    @2.16.0
    @PreMerge
    @Dmf
    @ColdStorage
    @DirectToCold
    Scenario Outline: Copy an object directly to a cold location
    Given a "<versioningConfiguration>" bucket
    And a disabled transition workflow to "e2e-cold" location
    And 1 objects "obj" of size <objectSize> bytes
    When "obj-1" is copied to "copy-1" with storage class "e2e-cold"
    Then object "copy-1" should be awaiting transition to "e2e-cold"
    Then object "copy-1" should be "transitioned" and have the storage class "e2e-cold"
    And dmf volume should contain 1 objects
    And i "should not" be able to read object "copy-1"
    And i "should" be able to read object "obj-1"

    Examples:
    | versioningConfiguration | objectSize |
    |           Non versioned |        100 |
    |               Versioned |        100 |

    @2.16.0
    @PreMerge
    @Dmf
    @ColdStorage
    @DirectToCold
    Scenario Outline: Move an existing object to a cold location by copying it onto itself
    Given a "<versioningConfiguration>" bucket
    And a disabled transition workflow to "e2e-cold" location
    And 1 objects "obj" of size <objectSize> bytes
    When "obj-1" is copied to "obj-1" with storage class "e2e-cold"
    Then object "obj-1" should be awaiting transition to "e2e-cold"
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-cold"
    And dmf volume should contain 1 objects
    And i "should not" be able to read object "obj-1"

    Examples:
    | versioningConfiguration | objectSize |
    |           Non versioned |        100 |

    @2.16.0
    @PreMerge
    @Dmf
    @ColdStorage
    @DirectToCold
    Scenario Outline: Direct-to-cold write to a bucket with a transition rule is archived once
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-cold" location
    And the archive requests sent to "e2e-cold" location are recorded
    And 2 objects "obj" of size <objectSize> bytes with storage class "e2e-cold"
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-cold"
    And object "obj-2" should be "transitioned" and have the storage class "e2e-cold"
    And dmf volume should contain 2 objects
    And the storage class of object "obj-1" must stay "e2e-cold" for 15 seconds
    And exactly 1 archive request should have been sent for object "obj-1"
    And exactly 1 archive request should have been sent for object "obj-2"
    And dmf volume should contain 2 objects

    Examples:
    | versioningConfiguration | objectSize |
    |           Non versioned |        100 |
    |               Versioned |        100 |
    |               Suspended |        100 |

    @2.16.0
    @PreMerge
    @Dmf
    @ColdStorage
    @DirectToCold
    Scenario Outline: Restore an object which is still awaiting transition
    Given a "<versioningConfiguration>" bucket
    And a disabled transition workflow to "e2e-cold" location
    And the archive requests sent to "e2e-cold" location are recorded
    And 1 objects "obj" of size <objectSize> bytes with storage class "e2e-cold"
    When i restore object "obj-1" for 2 days
    Then object "obj-1" should be "restoring" and have the storage class "e2e-cold"
    And object "obj-1" should be awaiting transition to "e2e-cold"
    And i "should" be able to read object "obj-1"
    When i restore object "obj-1" for <restoreDays> days
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-cold"
    And dmf volume should contain 1 objects
    Then object "obj-1" should be "restored" and have the storage class "e2e-cold"
    And object "obj-1" should expire in <restoreDays> days
    And i "should" be able to read object "obj-1"
    When i wait for <restoreDays> days
    Then object "obj-1" should be "cold" and have the storage class "e2e-cold"
    And i "should not" be able to read object "obj-1"
    And exactly 1 archive request should have been sent for object "obj-1"
    And dmf volume should contain 1 objects

    Examples:
    | versioningConfiguration | objectSize | restoreDays |
    |           Non versioned |        100 |           5 |
    |               Versioned |        100 |           5 |
    |               Suspended |        100 |           5 |

    @2.16.0
    @PreMerge
    @Dmf
    @ColdStorage
    @DirectToCold
    Scenario Outline: Retry a failed direct-to-cold transition
    Given a "<versioningConfiguration>" bucket
    And a disabled transition workflow to "e2e-cold" location
    And a flaky backend that will fail "archive" after 0 retries
    And the archive requests sent to "e2e-cold" location are recorded
    And 1 objects "obj" of size <objectSize> bytes with storage class "e2e-cold"
    Then the transition of object "obj-1" should fail
    And object "obj-1" should be awaiting transition to "e2e-cold"
    And i "should" be able to read object "obj-1"
    When i run sorbetctl to retry failed jobs for "e2e-cold" location
    Then the transition of object "obj-1" should fail on attempt 1
    And object "obj-1" should be awaiting transition to "e2e-cold" on attempt 1
    And i "should" be able to read object "obj-1"
    And exactly 2 archive requests should have been sent for object "obj-1"
    And dmf volume should contain 0 objects

    Examples:
    | versioningConfiguration | objectSize |
    |           Non versioned |        100 |
    |               Versioned |        100 |
