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
