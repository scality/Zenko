Feature: PRA operations

    @2.6.0
    @PreMerge
    @Dmf
    @PRA
    @ColdStorage
    Scenario Outline: PRA (nominal case)
    # Prepare objects in the primary site
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-cold" location
    And <objectCount> objects "obj" of size <objectSize> bytes on "Primary" site
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-cold"
    And object "obj-2" should be "transitioned" and have the storage class "e2e-cold"
    And dmf volume should contain <objectCount> objects
    
    # Deploy PRA
    Given a DR installed
    Then the DR source should be in phase "Running"
    And the DR sink should be in phase "Running"
    And the kafka DR volume exists
    And prometheus should scrap federated metrics from DR sink

    # Check that objects are transitioned in the DR site
    Given access keys for the replicated account

    Then object "obj-1" should "" be "transitioned" and have the storage class "e2e-cold" on "DR" site
    And object "obj-2" should "" be "transitioned" and have the storage class "e2e-cold" on "DR" site
    
    # Test again the transition workflow
    Given <objectCount> objects "obj2" of size <objectSize> bytes on "Pimary" site
    Then object "obj2-1" should "" be "transitioned" and have the storage class "e2e-cold" on "Primary" site
    And object "obj2-2" should "" be "transitioned" and have the storage class "e2e-cold" on "Primary" site
    Then object "obj2-1" should "" be "transitioned" and have the storage class "e2e-cold" on "DR" site
    And object "obj2-2" should "" be "transitioned" and have the storage class "e2e-cold" on "DR" site
    When i restore object "obj-1" for 2 days on "Primary" site
    Then object "obj-1" should "" be "restored" and have the storage class "e2e-cold" on "Primary" site
    And object "obj-1" should "" be "transitioned" and have the storage class "e2e-cold" on "DR" site

    # Test the readonly
    When the "vault-check-seeds" cronjobs completes without error on "Primary" site
    And the DATA_ACCESSOR user tries to perform PutObject on "DR" site
    Then it "should not" pass Vault authentication

    # Switch to failover
    When I request the failover state for the DR
    Then the DR sink should be in phase "Failover"

    # Restore on DR site
    When i restore object "obj2-1" for 200000 days on "DR" site
    Then object "obj2-1" should "" be "restored" and have the storage class "e2e-cold" on "DR" site
    And object "obj2-1" should "" be "transitioned" and have the storage class "e2e-cold" on "Primary" site

    # Switch to failback
    When I resume operations for the DR
    Then the DR sink should be in phase "Running"
    And object "obj2-1" should "" be "transitioned" and have the storage class "e2e-cold" on "DR" site

    # Pause / Resume DR
    When I pause the DR
    Then the DR source should be in phase "Paused"
    
    Given <objectCount> objects "obj3" of size <objectSize> bytes on "Pimary" site
    Then object "obj3-1" should "" be "transitioned" and have the storage class "e2e-cold" on "Primary" site
    And object "obj3-2" should "" be "transitioned" and have the storage class "e2e-cold" on "Primary" site    
    Then object "obj3-1" should "not" be "transitioned" and have the storage class "e2e-cold" on "DR" site
    And object "obj3-2" should "not" be "transitioned" and have the storage class "e2e-cold" on "DR" site

    When I resume the DR
    Then the DR source should be in phase "Running"
    Then object "obj3-1" should "" be "transitioned" and have the storage class "e2e-cold" on "DR" site
    And object "obj3-2" should "" be "transitioned" and have the storage class "e2e-cold" on "DR" site

    # Uninstall DR
    When I uninstall DR
    Then the DR custom resources should be deleted

    # Re-add objects to bucket
    Given <objectCount> objects "obj3" of size <objectSize> bytes on "Primary" site
    Then object "obj3-1" should "" be "transitioned" and have the storage class "e2e-cold" on "Primary" site

    # Deploy PRA again
    Given a DR installed
    Then the DR source should be in phase "Running"
    And the DR sink should be in phase "Running"
    Given access keys for the replicated account
    Then object "obj3-1" should "" be "transitioned" and have the storage class "e2e-cold" on "DR" site
    And object "obj3-2" should "" be "transitioned" and have the storage class "e2e-cold" on "DR" site

    # A version deleted on the primary site must be deleted on the DR site
    Given 1 objects "objdel" of size <objectSize> bytes on "Primary" site
    Then object "objdel-1" should "" be "transitioned" and have the storage class "e2e-cold" on "Primary" site
    And object "objdel-1" should "" be "transitioned" and have the storage class "e2e-cold" on "DR" site
    When i delete object "objdel-1" on "Primary" site
    Then object "objdel-1" should "not" exist on "DR" site

    # An object overwritten in place, which only a non-versioned bucket allows,
    # must carry its new metadata to the DR site
    Given a "Non versioned" bucket on "Primary" site
    And a transition workflow to "e2e-cold" location
    And 1 objects "objow" of size <objectSize> bytes on "Primary" site
    Then object "objow-1" should "" be "transitioned" and have the storage class "e2e-cold" on "Primary" site
    And object "objow-1" should "" be "transitioned" and have the storage class "e2e-cold" on "DR" site
    When i overwrite object "objow-1" with 200 bytes on "Primary" site
    Then object "objow-1" should "" be "transitioned" and have the storage class "e2e-cold" on "Primary" site
    And object "objow-1" should have the last written etag on "DR" site

    Examples:
    | versioningConfiguration | objectCount | objectSize |
    |           Non versioned |           2 |        100 |
    |               Versioned |           2 |        100 |

    @2.6.0
    @PreMerge
    @Dmf
    @PRA
    @ColdStorage
    Scenario: PRA (suspended null version deletion)
    # A put into a suspended bucket writes a null version, and deleting it
    # creates a null delete marker in its place. The marker itself does not
    # replicate -- it carries the bucket's location constraint, never a cold
    # one. What removes the object is the other write the delete makes:
    # cloudserver deletes the null version the marker replaces, and that
    # deletion carries the cold object's own metadata.
    Given a DR installed
    Then the DR source should be in phase "Running"
    And the DR sink should be in phase "Running"
    Given a "Suspended" bucket on "Primary" site
    And a transition workflow to "e2e-cold" location
    And 1 objects "objsdel" of size 100 bytes on "Primary" site
    Then object "objsdel-1" should "" be "transitioned" and have the storage class "e2e-cold" on "Primary" site
    Given access keys for the replicated account
    Then object "objsdel-1" should "" be "transitioned" and have the storage class "e2e-cold" on "DR" site
    When i delete object "objsdel-1" on "Primary" site
    Then object "objsdel-1" should "not" exist on "DR" site

    @2.6.0
    @PreMerge
    @Dmf
    @PRA
    @ColdStorage
    Scenario: PRA (unversioned deletion)
    # An unversioned bucket holds no version to remove, so a delete takes away
    # the object's only document. That is a different event from the version
    # removal the nominal scenario covers, and it runs on its own so that a
    # failure there does not hide it.
    Given a DR installed
    Then the DR source should be in phase "Running"
    And the DR sink should be in phase "Running"
    Given a "Non versioned" bucket on "Primary" site
    And a transition workflow to "e2e-cold" location
    And 1 objects "objudel" of size 100 bytes on "Primary" site
    Then object "objudel-1" should "" be "transitioned" and have the storage class "e2e-cold" on "Primary" site
    Given access keys for the replicated account
    Then object "objudel-1" should "" be "transitioned" and have the storage class "e2e-cold" on "DR" site
    When i delete object "objudel-1" on "Primary" site
    Then object "objudel-1" should "not" exist on "DR" site
