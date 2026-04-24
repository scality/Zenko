Feature: Storage Usage Reporting API
  The storage usage reporting API allows authorized Keycloak users to retrieve
  aggregated storage usage metrics across all accounts and locations.

    @2.14.0
    @PreMerge
    @StorageUsageReporting
    Scenario Outline: Storage usage report access control per persona
        Given an identity with the "<persona>" keycloak persona
        When the user tries to retrieve the storage usage report
        Then the http response code is <expectedStatus>

        Examples:
          | persona          | expectedStatus |
          | storage_manager          | 200            |
          | storage_usage_reporter   | 200            |
          | data_consumer            | 403            |

    @2.14.0
    @PreMerge
    @StorageUsageReporting
    Scenario: Storage usage report has a valid structure
        Given an identity with the "storage_manager" keycloak persona
        When the user retrieves the storage usage report
        Then the storage usage report response has a valid structure

    @2.14.0
    @PreMerge
    @StorageUsageReporting
    Scenario: Storage usage report contains multiple accounts
        Given an identity with the "storage_manager" keycloak persona
        And 2 additional accounts
        When the user retrieves the storage usage report
        Then the storage usage report contains the additional accounts

    @2.14.0
    @PreMerge
    @StorageUsageReporting
    @PrepareStorageUsageReportingScenarios
    Scenario Outline: Storage usage report returns accurate metrics
        Given the environment is set up with bucket created, test data uploaded, and count-items ran
        And an identity with the "storage_manager" keycloak persona
        When the user retrieves the storage usage report
        Then the report contains the test account with location "<locationName>"
        And the report shows 3 objects and 600 bytes

        Examples:
          | locationName |
          | us-east-1    |
