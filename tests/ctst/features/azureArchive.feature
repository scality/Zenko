Feature: Azure Archive

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    @ColdStorage
    Scenario Outline: Restore an already restored object
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "<coldLocationName>" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then object "obj-1" should be "transitioned" and have the storage class "<coldLocationName>"
    And object "obj-2" should be "transitioned" and have the storage class "<coldLocationName>"
    When i restore object "obj-1" for <restoreDays> days
    And i restore object "obj-2" for <restoreDays> days
    Then object "obj-1" should be "restored" and have the storage class "<coldLocationName>"
    And object "obj-2" should be "restored" and have the storage class "<coldLocationName>"
    And object "obj-1" should expire in <restoreDays> days
    And object "obj-2" should expire in <restoreDays> days
    When i restore object "obj-1" for 30 days
    And i restore object "obj-2" for 5 days
    Then object "obj-1" should expire in 30 days
    And object "obj-2" should expire in 5 days
    When i wait for 5 days
    Then object "obj-1" should expire in 25 days
    And object "obj-2" should be "cold" and have the storage class "<coldLocationName>"
    When i wait for 25 days
    Then object "obj-1" should be "cold" and have the storage class "<coldLocationName>"

    Examples:
        | versioningConfiguration | objectCount | objectSize |  restoreDays |  coldLocationName |
        |           Non versioned |           2 |        100 |           15 | e2e-azure-acrhive |
        |               Versioned |           2 |        100 |           15 | e2e-azure-acrhive |
        |               Suspended |           2 |        100 |           15 | e2e-azure-acrhive |
        |           Non versioned |           2 |        100 |           15 |          e2e-cold |
        |               Versioned |           2 |        100 |           15 |          e2e-cold |
        |               Suspended |           2 |        100 |           15 |          e2e-cold |