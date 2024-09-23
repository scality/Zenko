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
    Then the kafka DR volume exists

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

    Examples:
    | versioningConfiguration | objectCount | objectSize |
    |               Versioned |           2 |        100 |