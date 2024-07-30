Feature: PRA operations

    @2.6.0
    @PreMerge
    @Dmf
    @PRA
    @ColdStorage
    Scenario Outline: PRA
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-cold" location
    And <objectCount> objects "obj" of size <objectSize> bytes on "Primary" site
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-cold"
    And object "obj-2" should be "transitioned" and have the storage class "e2e-cold"
    And dmf volume should contain <objectCount> objects
    Given a DR installed
    Then the DR source should be in phase "Running"
    And the DR sink should be in phase "Running"
    Given access keys for the replicated account
    And a "disabled" transition workflow to "e2e-cold" location on "DR" site

    Then object "obj-1" should be "transitioned" and have the storage class "e2e-cold" on "DR" site
    And object "obj-2" should be "transitioned" and have the storage class "e2e-cold" on "DR" site
    Given <objectCount> objects "obj2" of size <objectSize> bytes on "Pimary" site
    Then object "obj2-1" should be "transitioned" and have the storage class "e2e-cold" on "Primary" site
    And object "obj2-2" should be "transitioned" and have the storage class "e2e-cold" on "Primary" site
    Then object "obj2-1" should be "transitioned" and have the storage class "e2e-cold" on "DR" site
    And object "obj2-2" should be "transitioned" and have the storage class "e2e-cold" on "DR" site
    When i restore object "obj-1" for 2 days on "Primary" site
    Then object "obj-1" should be "restored" and have the storage class "e2e-cold" on "Primary" site
    And object "obj-1" should be "transitioned" and have the storage class "e2e-cold" on "DR" site
    When i restore object "obj2-1" for 2 days on "DR" site
    Then object "obj2-1" should be "restored" and have the storage class "e2e-cold" on "DR" site
    And object "obj2-1" should be "transitioned" and have the storage class "e2e-cold" on "Primary" site

    And the kafka DR volume exists
    When I uninstall DR
    Then the DR custom resources should be deleted

    Examples:
    | versioningConfiguration | objectCount | objectSize |
    |               Versioned |           2 |        100 |


