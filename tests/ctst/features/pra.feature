Feature: PRA operations

    @2.6.0
    @PreMerge
    @Dmf
    @PRA
    @ColdStorage
    Scenario Outline: PRA
    # Setting-up the platform with objects
    Given a "<versioningConfiguration>" bucket
    And a transition workflow to "e2e-cold" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-cold"
    And object "obj-2" should be "transitioned" and have the storage class "e2e-cold"
    And dmf volume should contain <objectCount> objects
    # Install the DR resources
    Given a DR installed
    # Ensure we reach a correct state
    Then the DR sink should be in phase "Bootstrap:Waiting"
    And the DR source should be in phase "Bootstrap:Waiting"
    And object "obj-1" should be "transitioned" and have the storage class "e2e-cold" on "DR" site

    Examples:
    | versioningConfiguration | objectCount | objectSize |
    |           Non versioned |           2 |        100 |
    |               Versioned |           2 |        100 |
    |               Suspended |           2 |        100 |


