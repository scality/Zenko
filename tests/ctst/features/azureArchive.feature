Feature: Azure Archive

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    @ColdStorage
    Scenario Outline: Cannot add object MD to a transitioned object
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    Then i "should not" be able to add user metadata to object "obj-1"
    When i restore object "obj-1" for 10 days
    When i restore object "obj-2" for 10 days
    Then blob for object "obj-1" must be rehydrated
    Then blob for object "obj-2" must be rehydrated
    Then object "obj-1" should be "restored" and have the storage class "e2e-azure-archive"
    Then object "obj-2" should be "restored" and have the storage class "e2e-azure-archive"
    Then i "should" be able to add user metadata to object "obj-1"
    Then i "should" be able to add user metadata to object "obj-2"
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    Then object "obj-2" should be "transitioned" and have the storage class "e2e-azure-archive"

    Examples:
        | versioningConfiguration | objectCount | objectSize | packObjectCount |
        |           Non versioned |           2 |      30000 |               1 |
        |               Versioned |           2 |      30000 |               1 |
        |               Suspended |           2 |      30000 |               1 |
