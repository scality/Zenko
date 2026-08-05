Feature: Lifecycle expiration

    @2.16.0
    @PreMerge
    @Expiration
    @Lifecycle
    Scenario Outline: Days=0 expiration empties a "<versioningConfiguration>" bucket
    Given a "<versioningConfiguration>" bucket
    And 5 objects "expire-obj" of size 100 bytes
    When i set a lifecycle expiration of 0 days for the "<scope>"
    Then the bucket should contain 0 objects within 180 seconds

    Examples:
        | versioningConfiguration | scope                           |
        |           Non versioned | current version                 |
        |               Versioned | current and noncurrent versions |
        |               Suspended | current and noncurrent versions |
