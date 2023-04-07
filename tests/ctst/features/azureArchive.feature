Feature: Azure Archive

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    Scenario Outline: Archive objects when timeout is reached
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then the storage class of object "obj-1" must become "e2e-azure-archive"
    And the storage class of object "obj-2" must become "e2e-azure-archive"
    And manifest containing object "obj-1" should "contain" object "obj-2"
    And manifest access tier should be valid for object "obj-1"
    And tar access tier should be valid for object "obj-1"

    Examples:
        | versioningConfiguration | objectCount | objectSize |
        |           Non versioned |           2 |        100 |
        |               Versioned |           2 |        100 |
        # |               Suspended |           2 |        100 |

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    Scenario Outline: Archive 0 byte objects
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then the storage class of object "obj-1" must become "e2e-azure-archive"
    And the storage class of object "obj-2" must become "e2e-azure-archive"
    And the storage class of object "obj-3" must become "e2e-azure-archive"

    Examples:
        | versioningConfiguration | objectCount | objectSize |
        |           Non versioned |           3 |        0 |
        |               Versioned |           3 |        0 |
        # |               Suspended |           3 |        0 |

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    Scenario Outline: Respect maximum number of objects per archived Tar
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then the storage class of object "obj-1" must become "e2e-azure-archive"
    And the storage class of object "obj-2" must become "e2e-azure-archive"
    And the storage class of object "obj-3" must become "e2e-azure-archive"
    And the storage class of object "obj-4" must become "e2e-azure-archive"
    And the storage class of object "obj-5" must become "e2e-azure-archive"
    And the storage class of object "obj-6" must become "e2e-azure-archive"
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
        # |               Suspended |           6 |          1 |               3 |

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    Scenario Outline: Respect maximum size of an archived Tar
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then the storage class of object "obj-1" must become "e2e-azure-archive"
    And the storage class of object "obj-2" must become "e2e-azure-archive"
    And manifest and tar containing object "obj-1" should exist
    And manifest containing object "" should contain <packObjectCount> objects
    And manifest and tar containing object "obj-2" should exist
    And manifest containing object "" should contain <packObjectCount> objects
    
    Examples:
        | versioningConfiguration | objectCount | objectSize | packObjectCount |
        |           Non versioned |           2 |      30000 |               1 |
        |               Versioned |           2 |      30000 |               1 |
        # |               Suspended |           2 |      30000 |               1 |


    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    Scenario Outline: Restore objects from tar
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then the storage class of object "obj-1" must become "e2e-azure-archive"
    And the storage class of object "obj-2" must become "e2e-azure-archive"
    And manifest containing object "obj-1" should "contain" object "obj-2"
    When i restore object "obj-1" for <restoreDays> days
    Then blob for object "obj-1" must be rehydrated
    And blob for object "obj-2" must be rehydrated
    Then the storage class of object "obj-1" must become ""
    And the storage class of object "obj-2" must become "e2e-azure-archive"
    And object "obj-1" should expire in <restoreDays> days
    And object "obj-1" should have the same data
    When i restore object "obj-2" for <restoreDays> days
    Then the storage class of object "obj-2" must become ""
    And object "obj-2" should expire in <restoreDays> days
    And object "obj-2" should have the same data

    Examples:
        | versioningConfiguration | objectCount | objectSize | restoreDays |
        |           Non versioned |           2 |        100 |           5 |
        |               Versioned |           2 |        100 |           2 |
        # |               Suspended |           2 |        100 |           2 |

