Feature: Azure Archive

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    @ColdStorage
    Scenario Outline: Failed restore objects from tar must be retried and restored
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "retry-obj" of size <objectSize> bytes
    Then object "retry-obj-1" should be "transitioning" and have the storage class "e2e-azure-archive"
    And object "retry-obj-2" should be "transitioning" and have the storage class "e2e-azure-archive"
    And manifest containing object "retry-obj-1" should "contain" object "retry-obj-2"
    When i restore object "retry-obj-1" for <restoreDays> days
    Then blob for object "retry-obj-1" fails to rehydrate
    And blob for object "retry-obj-2" fails to rehydrate
    Then object "retry-obj-1" should be "transitioning" and have the storage class "e2e-azure-archive"
    When i run sorbetctl to retry failed restore for "e2e-azure-archive" location
    Then object "retry-obj-1" should be "restored" and have the storage class "e2e-azure-archive"
    And object "retry-obj-1" should expire in <restoreDays> days
    And object "retry-obj-1" should have the same data

    Examples:
        | versioningConfiguration | objectCount | objectSize | restoreDays |
        |           Non versioned |           2 |        100 |           5 |
        |               Versioned |           2 |        100 |           2 |
        |               Suspended |           2 |        100 |           2 | 

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    @ColdStorage
    Scenario Outline: Archive objects when timeout is reached
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "timeout-obj" of size <objectSize> bytes
    Then object "timeout-obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "timeout-obj-2" should be "transitioned" and have the storage class "e2e-azure-archive"
    And manifest containing object "timeout-obj-1" should "contain" object "timeout-obj-2"
    And manifest access tier should be valid for object "timeout-obj-1"
    And tar access tier should be valid for object "timeout-obj-1"

    Examples:
        | versioningConfiguration | objectCount | objectSize |
        |           Non versioned |           2 |        100 |
        |               Versioned |           2 |        100 |
        |               Suspended |           2 |        100 |

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    @ColdStorage
    Scenario Outline: Archive 0 byte objects
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "zerobyte-obj" of size <objectSize> bytes
    Then object "zerobyte-obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "zerobyte-obj-2" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "zerobyte-obj-3" should be "transitioned" and have the storage class "e2e-azure-archive"

    Examples:
        | versioningConfiguration | objectCount | objectSize |
        |           Non versioned |           3 |        0 |
        |               Versioned |           3 |        0 |
        |               Suspended |           3 |        0 |

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

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    @ColdStorage
    Scenario Outline: Respect maximum number of objects per archived Tar
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "maxcount-obj" of size <objectSize> bytes
    Then object "maxcount-obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "maxcount-obj-2" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "maxcount-obj-3" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "maxcount-obj-4" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "maxcount-obj-5" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "maxcount-obj-6" should be "transitioned" and have the storage class "e2e-azure-archive"
    And manifest and tar containing object "maxcount-obj-1" should exist
    And manifest containing object "" should contain <packObjectCount> objects
    And manifest and tar containing object "maxcount-obj-2" should exist
    And manifest containing object "" should contain <packObjectCount> objects
    And manifest and tar containing object "maxcount-obj-3" should exist
    And manifest containing object "" should contain <packObjectCount> objects
    And manifest and tar containing object "maxcount-obj-4" should exist
    And manifest containing object "" should contain <packObjectCount> objects
    And manifest and tar containing object "maxcount-obj-5" should exist
    And manifest containing object "" should contain <packObjectCount> objects
    And manifest and tar containing object "maxcount-obj-6" should exist
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
    @ColdStorage
    Scenario Outline: Respect maximum size of an archived Tar
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "maxsize-obj" of size <objectSize> bytes
    Then object "maxsize-obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "maxsize-obj-2" should be "transitioned" and have the storage class "e2e-azure-archive"
    And manifest and tar containing object "maxsize-obj-1" should exist
    And manifest containing object "" should contain <packObjectCount> objects
    And manifest and tar containing object "maxsize-obj-2" should exist
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
    @ColdStorage
    Scenario Outline: Restore an already restored object
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "rerestore-obj" of size <objectSize> bytes
    Then object "rerestore-obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "rerestore-obj-2" should be "transitioned" and have the storage class "e2e-azure-archive"
    When i restore object "rerestore-obj-1" for <restoreDays> days
    And i restore object "rerestore-obj-2" for <restoreDays> days
    Then blob for object "rerestore-obj-1" must be rehydrated
    And blob for object "rerestore-obj-2" must be rehydrated
    Then object "rerestore-obj-1" should be "restored" and have the storage class "e2e-azure-archive"
    And object "rerestore-obj-2" should be "restored" and have the storage class "e2e-azure-archive"
    And object "rerestore-obj-1" should expire in <restoreDays> days
    And object "rerestore-obj-2" should expire in <restoreDays> days
    When i restore object "rerestore-obj-1" for 30 days
    And i restore object "rerestore-obj-2" for 5 days
    Then object "rerestore-obj-1" should expire in 30 days
    And object "rerestore-obj-2" should expire in 5 days
    When i wait for 5 days
    Then object "rerestore-obj-1" should expire in 25 days
    And object "rerestore-obj-2" should be "cold" and have the storage class "e2e-azure-archive"
    When i wait for 25 days
    Then object "rerestore-obj-1" should be "cold" and have the storage class "e2e-azure-archive"

    Examples:
        | versioningConfiguration | objectCount | objectSize | restoreDays |
        |           Non versioned |           2 |        100 |           15 |
        |               Versioned |           2 |        100 |           15 |
        |               Suspended |           2 |        100 |           15 |

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    @ColdStorage
    Scenario Outline: Restore an object that has already been restored and expired
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "expired-obj" of size <objectSize> bytes
    Then object "expired-obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    When i restore object "expired-obj-1" for <restoreDays> days
    Then blob for object "expired-obj-1" must be rehydrated
    Then object "expired-obj-1" should be "restored" and have the storage class "e2e-azure-archive"
    And object "expired-obj-1" should expire in <restoreDays> days
    When i wait for <restoreDays> days
    Then object "expired-obj-1" should be "cold" and have the storage class "e2e-azure-archive"
    Then i restore object "expired-obj-1" for <restoreDays> days
    Then object "expired-obj-1" should be "restored" and have the storage class "e2e-azure-archive"
    And object "expired-obj-1" should expire in <restoreDays> days
    When i wait for <restoreDays> days
    Then object "expired-obj-1" should be "cold" and have the storage class "e2e-azure-archive"

    Examples:
        | versioningConfiguration | objectCount | objectSize | restoreDays |
        |           Non versioned |           2 |        100 |           15 |
        |               Versioned |           2 |        100 |           15 |
        |               Suspended |           2 |        100 |           15 |

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    @ColdStorage
    Scenario Outline: Restore objects from tar
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "restore-obj" of size <objectSize> bytes with user metadata "x-amz-meta-123=456"
    And object "restore-obj-2" should have the user metadata with key "x-amz-meta-123" and value "456"
    And a tag on object "restore-obj-1" with key "tag1" and value "value1"
    And a tag on object "restore-obj-2" with key "tag2" and value "value2"
    Then object "restore-obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "restore-obj-2" should be "transitioned" and have the storage class "e2e-azure-archive"
    And manifest containing object "restore-obj-1" should "contain" object "restore-obj-2"
    When i restore object "restore-obj-1" for <restoreDays> days
    Then blob for object "restore-obj-1" must be rehydrated
    And blob for object "restore-obj-2" must be rehydrated
    Then object "restore-obj-1" should be "restored" and have the storage class "e2e-azure-archive"
    And object "restore-obj-1" should expire in <restoreDays> days
    And object "restore-obj-1" should have the same data
    And object "restore-obj-1" should have the tag "tag1" with value "value1"
    And object "restore-obj-1" should have the user metadata with key "x-amz-meta-123" and value "456"
    When i restore object "restore-obj-2" for <restoreDays> days
    Then object "restore-obj-2" should be "restored" and have the storage class "e2e-azure-archive"
    And object "restore-obj-2" should expire in <restoreDays> days
    And object "restore-obj-2" should have the same data
    And object "restore-obj-2" should have the tag "tag2" with value "value2"
    And object "restore-obj-2" should have the user metadata with key "x-amz-meta-123" and value "456"

    When i wait for <restoreDays> days
    Then object "restore-obj-1" should be "cold" and have the storage class "e2e-azure-archive"
    Then object "restore-obj-2" should be "cold" and have the storage class "e2e-azure-archive"

    Examples:
        | versioningConfiguration | objectCount | objectSize | restoreDays |
        |           Non versioned |           2 |        100 |           15 |
        |               Versioned |           2 |        100 |           15 |
        |               Suspended |           2 |        100 |           15 |

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    @ColdStorage
    Scenario Outline: Pause and resume archiving to azure (PutObject after pause)
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And that lifecycle is "paused" for the "e2e-azure-archive" location
    And <objectCount> objects "pause-obj" of size <objectSize> bytes
    Then the storage class of object "pause-obj-1" must stay "" for <timeout> seconds
    And the storage class of object "pause-obj-2" must stay "" for <timeout> seconds
    Given that lifecycle is "resumed" for the "e2e-azure-archive" location
    Then object "pause-obj-1" should be "transitioning" and have the storage class "e2e-azure-archive"
    And object "pause-obj-2" should be "transitioning" and have the storage class "e2e-azure-archive"

    Examples:
        | versioningConfiguration | objectCount | objectSize | timeout |
        |           Non versioned |           2 |      30000 |      10 |
        |               Versioned |           2 |      30000 |      10 |
        |               Suspended |           2 |      30000 |      10 |

# This test is flaky, and doesn't make much sense as it is :
# Put object, setup Transition workflow, Then pause that transition,
# but by the time the transition is paused,
# the object is often already transitioned, so the test is failing on this step :
# the storage class of object "obj-1" must stay ""
# We should put the object after pausing the transition, 
# but then we end up making the same test as the scenario above : "PutObject after pause"

    # @2.7.0
    # @PreMerge
    # @Flaky
    # @AzureArchive
    # Scenario Outline: Pause and resume archiving to azure (PutObject before pause)
    # Given a "<versioningConfiguration>" bucket
    # And <objectCount> objects "obj" of size <objectSize> bytes
    # And a transition workflow to "e2e-azure-archive" location
    # And that lifecycle is "paused" for the "e2e-azure-archive" location
    # Then the storage class of object "obj-1" must stay "" for <timeout> seconds
    # And the storage class of object "obj-2" must stay "" for <timeout> seconds
    # Given that lifecycle is "resumed" for the "e2e-azure-archive" location
    # Then object "obj-1" should be "transitioning" and have the storage class "e2e-azure-archive"
    # And object "obj-2" should be "transitioning" and have the storage class "e2e-azure-archive"

    # Examples:
    #     | versioningConfiguration | objectCount | objectSize | timeout |
    #     |           Non versioned |           2 |      30000 |      10 |
    #     |               Versioned |           2 |      30000 |      10 |
    #     |               Suspended |           2 |      30000 |      10 |

    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    @ColdStorage
    Scenario Outline: Restore notifications are triggered
    Given a "<versioningConfiguration>" bucket
    And one notification destination
    And i subscribe to "s3:ObjectRestore:*" notifications for destination 0
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "notif-obj" of size <objectSize> bytes
    Then object "notif-obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "notif-obj-2" should be "transitioned" and have the storage class "e2e-azure-archive"
    When i restore object "notif-obj-2" for <restoreDays> days
    Then i should "receive" a notification for "s3:ObjectRestore:Post" event in destination 0
    And blob for object "notif-obj-2" must be rehydrated
    Then object "notif-obj-2" should be "restored" and have the storage class "e2e-azure-archive"
    Then i should "receive" a notification for "s3:ObjectRestore:Completed" event in destination 0
    When i wait for <restoreDays> days
    Then i should "receive" a notification for "s3:ObjectRestore:Delete" event in destination 0
    
    Examples:
        | versioningConfiguration | objectCount | objectSize | restoreDays |
        |           Non versioned |           2 |        100 |           15 |
        |               Versioned |           2 |        100 |           15 |
        |               Suspended |           2 |        100 |           15 |


    @2.7.0
    @PreMerge
    @Flaky
    @AzureArchive
    @ColdStorage
    Scenario Outline: Cannot add object MD to a transitioned object
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-azure-archive" location
    And <objectCount> objects "metadata-obj" of size <objectSize> bytes
    Then object "metadata-obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    Then i "should not" be able to add user metadata to object "metadata-obj-1"
    When i restore object "metadata-obj-1" for 10 days
    When i restore object "metadata-obj-2" for 10 days
    Then blob for object "metadata-obj-1" must be rehydrated
    Then blob for object "metadata-obj-2" must be rehydrated
    Then object "metadata-obj-1" should be "restored" and have the storage class "e2e-azure-archive"
    Then object "metadata-obj-2" should be "restored" and have the storage class "e2e-azure-archive"
    Then i "should" be able to add user metadata to object "metadata-obj-1"
    Then i "should" be able to add user metadata to object "metadata-obj-2"
    Then object "metadata-obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    Then object "metadata-obj-2" should be "transitioned" and have the storage class "e2e-azure-archive"

    Examples:
        | versioningConfiguration | objectCount | objectSize | packObjectCount |
        |           Non versioned |           2 |      30000 |               1 |
        |               Versioned |           2 |      30000 |               1 |
        |               Suspended |           2 |      30000 |               1 |
