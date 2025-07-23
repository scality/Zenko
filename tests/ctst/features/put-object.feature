Feature: Put Object operations

    @2.6.0
    @PreMerge
    Scenario Outline: Handle versionId collision on PutObject
    Given a "Versioned" bucket
    And 100 versions of objects "obj" of size 100 bytes with 10 threads
    Then 1000 versions of objects "obj" should exist 
