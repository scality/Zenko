Feature: PRA operations

    @2.6.0
    @PreMerge
    @PRA
    @Dmf
    @ColdStorage
    Scenario: Install PRA and verify archives are replicated
    Given a "Versioned" bucket
    And a transition workflow to "e2e-cold" location
    And <objectCount> objects "obj" of size <objectSize> bytes
    Then object "obj-1" should be "transitioned" and have the storage class "e2e-azure-archive"
    And object "obj-2" should be "transitioned" and have the storage class "e2e-azure-archive"


