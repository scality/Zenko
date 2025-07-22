Feature: Put Object operations

    @2.6.0
    @PreMerge
    Scenario Outline: Handle versionId collision on PutObject
    Given a "Versioned" bucket
    And 1000 objects "obj" of size 100 bytes
    Then no collision should occur on versionId
