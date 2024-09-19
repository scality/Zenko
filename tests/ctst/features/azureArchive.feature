Feature: Azure Archive

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
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
    When i restore object "obj-1" for 255 days
    And i restore object "obj-2" for 5 days
    Then object "obj-1" should expire in 30 days
    And object "obj-2" should expire in 5 days
    When i wait for 5 days
    Then object "obj-1" should expire in 250 days
    And object "obj-2" should be "cold" and have the storage class "e2e-cold"
    When i wait for 250 days
    Then object "obj-1" should be "cold" and have the storage class "e2e-cold"

    Examples:
        | versioningConfiguration | objectCount | objectSize | restoreDays |
        |           Non versioned |           2 |        100 |           15 |
        |               Versioned |           2 |        100 |           15 |
        |               Suspended |           2 |        100 |           15 |
