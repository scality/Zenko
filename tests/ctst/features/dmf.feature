Feature: DMF

    @2.7.0
    @PreMerge
    @Dmf
    @ColdStorage
    Scenario Outline: Deletion of an archived object
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-cold" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-cold"
    And object "obj-2" should be "transitioned" and have the storage class "e2e-cold"
    And dmf volume should contain <objectCount> objects
    When i delete object "obj-1"
    And i delete object "obj-2"
    Then dmf volume should contain 0 objects

    Examples:
    | versioningConfiguration | objectCount | objectSize |
    |           Non versioned |           2 |        100 |
    |               Versioned |           2 |        100 |
    |               Suspended |           2 |        100 |

    @2.7.0
    @PreMerge
    @Dmf
    @ColdStorage
    @Flaky
    Scenario Outline: Retry DMF job/command upon failure
    Given a "<versioningConfiguration>" bucket
    And a flaky backend that will require <retryNumber> retries for "<operation>"
    And a transition workflow to "e2e-cold" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-cold"
    And object "obj-2" should be "transitioned" and have the storage class "e2e-cold"
    When i restore object "obj-1" for 5 days
    Then object "obj-1" should be "restored" and have the storage class "e2e-cold"
    When i delete object "obj-1"
    And i delete object "obj-2"
    Then dmf volume should contain 0 objects

    Examples:
    | versioningConfiguration | objectCount | objectSize | retryNumber | operation |
    |           Non versioned |           2 |        100 |           1 |   archive |
    |               Versioned |           2 |        100 |           1 |   archive |
    |               Suspended |           2 |        100 |           1 |   archive |
    |           Non versioned |           2 |        100 |           1 |   restore |
    |               Versioned |           2 |        100 |           1 |   restore |
    |               Suspended |           2 |        100 |           1 |   restore |
    |           Non versioned |           2 |        100 |           1 |   command |
    |               Versioned |           2 |        100 |           1 |   command |
    |               Suspended |           2 |        100 |           1 |   command |

    @2.7.0
    @PreMerge
    @Dmf
    @ColdStorage
    Scenario Outline: Deletion of a restored object
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-cold" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-cold"
    And object "obj-2" should be "transitioned" and have the storage class "e2e-cold"
    And dmf volume should contain <objectCount> objects
    When i restore object "obj-1" for <restoreDays> days
    Then object "obj-1" should be "restored" and have the storage class "e2e-cold"
    When i delete object "obj-1"
    And i delete object "obj-2"
    Then dmf volume should contain 0 objects

    Examples:
    | versioningConfiguration | objectCount | objectSize | restoreDays |
    |           Non versioned |           2 |        100 |           1 |
    |               Versioned |           2 |        100 |           1 |
    |               Suspended |           2 |        100 |           1 |

    @2.7.0
    @PreMerge
    @Dmf
    @ColdStorage
    Scenario Outline: Overwriting of a cold object
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-cold" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-cold"
    And dmf volume should contain <objectCount> objects
    Given <objectCount> objects "obj" of size <objectSize> bytes
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-cold"
    Then dmf volume should contain 1 objects

    Examples:
    | versioningConfiguration | objectCount | objectSize |
    |           Non versioned |           1 |        100 |
    |               Suspended |           1 |        100 |


    @2.7.0
    @PreMerge
    @Flaky
    @Dmf
    @ColdStorage
    Scenario Outline: Restore an already restored object
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-cold" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-cold"
    And object "obj-2" should be "transitioned" and have the storage class "e2e-cold"
    When i restore object "obj-1" for <restoreDays> days
    And i restore object "obj-2" for <restoreDays> days
    Then object "obj-1" should be "restored" and have the storage class "e2e-cold"
    And object "obj-2" should be "restored" and have the storage class "e2e-cold"
    And object "obj-1" should expire in <restoreDays> days
    And object "obj-2" should expire in <restoreDays> days
    When i restore object "obj-1" for 30 days
    And i restore object "obj-2" for 5 days
    Then object "obj-1" should expire in 30 days
    And object "obj-2" should expire in 5 days
    When i wait for 5 days
    Then object "obj-1" should expire in 25 days
    And object "obj-2" should be "cold" and have the storage class "e2e-cold"
    When i wait for 25 days
    Then object "obj-1" should be "cold" and have the storage class "e2e-cold"

    Examples:
        | versioningConfiguration | objectCount | objectSize | restoreDays |
        |           Non versioned |           2 |        100 |           15 |
        |               Versioned |           2 |        100 |           15 |
        |               Suspended |           2 |        100 |           15 |