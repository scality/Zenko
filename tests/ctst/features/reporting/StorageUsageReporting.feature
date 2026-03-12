Feature: Storage Usage Reporting API
  The storage usage reporting API allows authorized Keycloak users to retrieve
  aggregated storage usage metrics across all accounts and locations.

    # Permission tests
    @2.14.0
    @PreMerge
    @StorageUsageReporting
    Scenario Outline: Storage usage report access control per role
        When the user retrieves the storage usage report as "<role>"
        Then the storage usage report http response code is <expectedStatus>

        Examples:
          | role             | expectedStatus |
          | storage_manager  | 200            |
          | data_consumer    | 403            |

    # Content tests
    @2.14.0
    @PreMerge
    @StorageUsageReporting
    Scenario: Storage usage report has a valid structure
        When the user retrieves the storage usage report as "storage_manager"
        Then the storage usage report http response code is 200
        And the storage usage report response has a valid structure

    @2.14.0
    @PreMerge
    @StorageUsageReporting
    Scenario: Storage usage report contains multiple accounts
        Given 2 additional accounts
        When the user retrieves the storage usage report as "storage_manager"
        Then the storage usage report http response code is 200
        And the storage usage report contains the additional accounts

    @2.14.0
    @PreMerge
    @StorageUsageReporting
    @PrepareStorageUsageReportingScenarios
    Scenario Outline: Storage usage report returns accurate metrics
        Given the environment is set up with bucket created, test data uploaded, and count-items ran
        When the user retrieves the storage usage report as "storage_manager"
        Then the storage usage report http response code is 200
        And the storage usage report contains the test account with location "<locationName>"
        And the location metrics show 3 objects and 600 bytes

        Examples:
          | locationName |
          | us-east-1    |
