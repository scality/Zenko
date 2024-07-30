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
    # CHeck that objects are transitioned in the DR site
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
    When i restore object "obj2-1" for 2 days on "DR" site
    Then object "obj2-1" should "" be "restored" and have the storage class "e2e-cold" on "DR" site
    And object "obj2-1" should "" be "transitioned" and have the storage class "e2e-cold" on "Primary" site
    # Pause the DR
    When I pause the DR
    Then the DR source should be in phase "Paused"
    And the DR sink should be in phase "Paused"
    # Ensure no transition while DR is paused
    Given <objectCount> objects "obj3" of size <objectSize> bytes on "Primary" site
    Then object "obj3-1" should "" be "transitioned" and have the storage class "e2e-cold" on "Primary" site
    And object "obj3-2" should "" be "transitioned" and have the storage class "e2e-cold" on "Primary" site
    Then object "obj3-1" should "not" be "transitioned" and have the storage class "e2e-cold" on "DR" site
    And object "obj3-2" should "not" be "transitioned" and have the storage class "e2e-cold" on "DR" site
    # Resume the DR: ensure transition is resumed
    When I resume the DR
    Then the DR source should be in phase "Running"
    And the DR sink should be in phase "Running"
    Then object "obj3-1" should "" be "transitioned" and have the storage class "e2e-cold" on "DR" site
    And object "obj3-2" should "" be "transitioned" and have the storage class "e2e-cold" on "DR" site
    # Uninstall DR
    When I uninstall DR
    Then the DR custom resources should be deleted

    Examples:
    | versioningConfiguration | objectCount | objectSize |
    |               Versioned |           2 |        100 |

    @2.6.0
    @PreMerge
    @Dmf
    @PRA
    @ColdStorage
    Scenario Outline: PRA (failure case)
    # Fail to deploy PRA
    Given a DR failing to be installed
    Then the DR source should be in phase "Bootstrap:Failed"
    And the DR sink should be in phase "Bootstrap:Failed"
    # Expect the operator to perform Reinit and to back to Waiting state
    Then the DR source should be in phase "Bootstrap:Waiting"
    And the DR sink should be in phase "Bootstrap:Waiting"
    # Retry to deploy PRA
    Given a DR installed
    Then the DR source should be in phase "Running"
    And the DR sink should be in phase "Running"
    Then the kafka DR volume exists
    # Uninstall PRA
    When I uninstall DR
    Then the DR custom resources should be deleted
