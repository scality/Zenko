Feature: Azure Archive

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    @ColdStorage
    Scenario Outline: Create, read, update and delete azure archive location
    Given an azure archive location "<locationName>"
    And a "<versioningConfiguration>" bucket
    And a transition workflow to "<locationName>" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then object "obj-1" should be "transitioning" and have the storage class "<locationName>"
    And object "obj-2" should be "transitioning" and have the storage class "<locationName>"
    And object "obj-3" should be "transitioning" and have the storage class "<locationName>"
    When i change azure archive location "<locationName>" container target
    Given <objectCount> objects "obj2" of size <objectSize> bytes
    Then object "obj2-1" should be "transitioning" and have the storage class "<locationName>"
    And object "obj2-2" should be "transitioning" and have the storage class "<locationName>"
    And object "obj2-3" should be "transitioning" and have the storage class "<locationName>"

    Examples:
        | versioningConfiguration | objectCount | objectSize |                      locationName |
        |           Non versioned |           3 |          0 | e2e-azure-archive-2-non-versioned |
        |               Versioned |           3 |          0 |     e2e-azure-archive-2-versioned |
        |               Suspended |           3 |          0 |     e2e-azure-archive-2-suspended |
