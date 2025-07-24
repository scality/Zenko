Feature: Put Object operations

    @2.6.0
    @PreMerge
    Scenario Outline: Handle versionId collision on PutObject
    Given a "Versioned" bucket
    And 10 threads each uploading 100 versions of object "obj" of size 100 bytes
    Then 1000 versions of objects "obj" should exist 
