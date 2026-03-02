Feature: Storage Usage Reporting API
  The storage usage reporting API allows authorized Keycloak users to retrieve
  aggregated storage usage metrics across all accounts and locations.

    @2.14.0
    @PreMerge
    @StorageUsageReporting
    Scenario: StorageManager can retrieve the storage usage report
        Given a STORAGE_MANAGER type
        When the user retrieves the storage usage report
        Then the storage usage report http response code is 200
        And the storage usage report response has a valid structure

    @2.14.0
    @PreMerge
    @StorageUsageReporting
    Scenario: No-rights Keycloak user cannot retrieve the storage usage report
        When the user retrieves the storage usage report as a no-rights user
        Then the storage usage report http response code is 403

    @2.14.0
    @PreMerge
    @StorageUsageReporting
    Scenario: Storage usage report contains multiple accounts
        Given 2 additional accounts
        And a STORAGE_MANAGER type
        When the user retrieves the storage usage report
        Then the storage usage report http response code is 200
        And the storage usage report contains the additional accounts

    @2.14.0
    @PreMerge
    @StorageUsageReporting
    @PrepareStorageUsageReportingScenarios
    Scenario Outline: Storage usage report returns accurate metrics
        Given the environment is set up with bucket created, test data uploaded, and count-items ran
        And a STORAGE_MANAGER type
        When the user retrieves the storage usage report
        Then the storage usage report http response code is 200
        And the storage usage report contains the test account with location "<locationName>"
        And the location metrics show 3 objects and 600 bytes

        Examples:
          | locationName |
          | us-east-1    |
