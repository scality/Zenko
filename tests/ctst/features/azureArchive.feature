Feature: Azure Archive

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    Scenario Outline: Archive objects when timeout is reached
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "obj-2" should be "transitioned" and have the storage class "e2e-azure-archive"
    And manifest containing object "obj-1" should "contain" object "obj-2"
    And manifest access tier should be valid for object "obj-1"
    And tar access tier should be valid for object "obj-1"

    Examples:
        | versioningConfiguration | objectCount | objectSize |
        |           Non versioned |           2 |        100 |
        |               Versioned |           2 |        100 |
        |               Suspended |           2 |        100 |

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    Scenario Outline: Archive 0 byte objects
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "obj-2" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "obj-3" should be "transitioned" and have the storage class "e2e-azure-archive"

    Examples:
        | versioningConfiguration | objectCount | objectSize |
        |           Non versioned |           3 |        0 |
        |               Versioned |           3 |        0 |
        |               Suspended |           3 |        0 |

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    @WIP
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

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    Scenario Outline: Respect maximum number of objects per archived Tar
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "obj-2" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "obj-3" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "obj-4" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "obj-5" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "obj-6" should be "transitioned" and have the storage class "e2e-azure-archive"
    And manifest and tar containing object "obj-1" should exist
    And manifest containing object "" should contain <packObjectCount> objects
    And manifest and tar containing object "obj-2" should exist
    And manifest containing object "" should contain <packObjectCount> objects
    And manifest and tar containing object "obj-3" should exist
    And manifest containing object "" should contain <packObjectCount> objects
    And manifest and tar containing object "obj-4" should exist
    And manifest containing object "" should contain <packObjectCount> objects
    And manifest and tar containing object "obj-5" should exist
    And manifest containing object "" should contain <packObjectCount> objects
    And manifest and tar containing object "obj-6" should exist
    And manifest containing object "" should contain <packObjectCount> objects

    Examples:
        | versioningConfiguration | objectCount | objectSize | packObjectCount |
        |           Non versioned |           6 |          1 |               3 |
        |               Versioned |           6 |          1 |               3 |
        |               Suspended |           6 |          1 |               3 |

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    Scenario Outline: Respect maximum size of an archived Tar
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "obj-2" should be "transitioned" and have the storage class "e2e-azure-archive"
    And manifest and tar containing object "obj-1" should exist
    And manifest containing object "" should contain <packObjectCount> objects
    And manifest and tar containing object "obj-2" should exist
    And manifest containing object "" should contain <packObjectCount> objects
    
    Examples:
        | versioningConfiguration | objectCount | objectSize | packObjectCount |
        |           Non versioned |           2 |      30000 |               1 |
        |               Versioned |           2 |      30000 |               1 |
        |               Suspended |           2 |      30000 |               1 |


    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    Scenario Outline: Restore objects from tar
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "obj" of size <objectSize> bytes with user metadata "x-amz-meta-123=456"
    And object "obj-2" should have the user metadata with key "x-amz-meta-123" and value "456"
    And a tag on object "obj-1" with key "tag1" and value "value1"
    And a tag on object "obj-2" with key "tag2" and value "value2"
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "obj-2" should be "transitioned" and have the storage class "e2e-azure-archive"
    And manifest containing object "obj-1" should "contain" object "obj-2"
    When i restore object "obj-1" for <restoreDays> days
    Then blob for object "obj-1" must be rehydrated
    And blob for object "obj-2" must be rehydrated
    Then object "obj-1" should be "restored" and have the storage class "e2e-azure-archive"
    And object "obj-1" should expire in <restoreDays> days
    And object "obj-1" should have the same data
    And object "obj-1" should have the tag "tag1" with value "value1"
    And object "obj-1" should have the user metadata with key "x-amz-meta-123" and value "456"
    When i restore object "obj-2" for <restoreDays> days
    Then object "obj-2" should be "restored" and have the storage class "e2e-azure-archive"
    And object "obj-2" should expire in <restoreDays> days
    And object "obj-2" should have the same data
    And object "obj-2" should have the tag "tag2" with value "value2"
    And object "obj-2" should have the user metadata with key "x-amz-meta-123" and value "456"

    When i wait for <restoreDays> days
    Then object "obj-1" should be "cold" and have the storage class "e2e-azure-archive"
    Then object "obj-2" should be "cold" and have the storage class "e2e-azure-archive"

    Examples:
        | versioningConfiguration | objectCount | objectSize | restoreDays |
        |           Non versioned |           2 |        100 |           15 |
        |               Versioned |           2 |        100 |           15 |
        |               Suspended |           2 |        100 |           15 |

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    Scenario Outline: Failed restore objects from tar must be retried and restored
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then object "obj-1" should be "transitioning" and have the storage class "e2e-azure-archive"
    And object "obj-2" should be "transitioning" and have the storage class "e2e-azure-archive"
    And manifest containing object "obj-1" should "contain" object "obj-2"
    When i restore object "obj-1" for <restoreDays> days
    Then blob for object "obj-1" fails to rehydrate
    And blob for object "obj-2" fails to rehydrate
    Then object "obj-1" should be "transitioning" and have the storage class "e2e-azure-archive"
    When i run sorbetctl to retry failed restore for "e2e-azure-archive" location
    Then object "obj-1" should be "restored" and have the storage class "e2e-azure-archive"
    And object "obj-1" should expire in <restoreDays> days
    And object "obj-1" should have the same data

    Examples:
        | versioningConfiguration | objectCount | objectSize | restoreDays |
        |           Non versioned |           2 |        100 |           5 |
        |               Versioned |           2 |        100 |           2 |
        # |               Suspended |           2 |        100 |           2 | 