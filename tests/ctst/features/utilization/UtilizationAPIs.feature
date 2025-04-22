Feature: Scality Utilization Reporting (SUR) API
  The utilization metrics API allows different authorized users to retrieve 
  metrics for buckets, accounts, and locations.

    @2.11.0
    @PreMerge
    @Utilization
    @UtilizationAPI
    Scenario Outline: Default roles can retrieve utilization metrics
        Given an existing bucket "" "without" versioning, "without" ObjectLock "" retention mode
        When I PUT an object with size 100
        And the "count-items" cronjobs completes without error
        Given a <userType> type
        When the user retrieves utilization metrics using scubaclient for metric type "<metricType>"
        Then the latest utilization metrics are retrieved

        Examples:
          | userType              | metricType |
          | STORAGE_MANAGER       | bucket     |
          | STORAGE_ACCOUNT_OWNER | bucket     |
          | DATA_CONSUMER         | bucket     |
          | STORAGE_MANAGER       | account    |
          | STORAGE_ACCOUNT_OWNER | account    |
          | DATA_CONSUMER         | account    |
          | STORAGE_MANAGER       | location   |
          | STORAGE_ACCOUNT_OWNER | location   |
          | DATA_CONSUMER         | location   |

    @2.11.0
    @PreMerge
    @Utilization
    @UtilizationAPI
    Scenario Outline: IAM users with correct permissions can retrieve utilization metrics
        Given an existing bucket "" "without" versioning, "without" ObjectLock "" retention mode
        When I PUT an object with size 100
        And the "count-items" cronjobs completes without error
        Given a <userType> type
        When the user retrieves utilization metrics using scubaclient for metric type "<metricType>"
        Then the latest utilization metrics are retrieved

        Examples:
          | metricType |
          | bucket     |
          | account    |
          | location   |

    @2.11.0
    @PreMerge
    @Utilization
    @UtilizationAPI
    Scenario Outline: Unauthorized users cannot retrieve utilization metrics
        Given an existing bucket "" "without" versioning, "without" ObjectLock "" retention mode
        Given a IAM_USER type
        When the user retrieves utilization metrics using scubaclient for metric type "<metricType>"
        Then the user should receive "AccessDenied" error

        Examples:
          | metricType |
          | bucket     |
          | account    |
          | location   |

    @2.11.0
    @PreMerge
    @Utilization
    @UtilizationAPI
    Scenario Outline: IAM users with explicit deny policy cannot retrieve utilization metrics
        Given an existing bucket "" "without" versioning, "without" ObjectLock "" retention mode
        When I PUT an object with size 100
        Given a IAM_USER type
        When the user retrieves utilization metrics using scubaclient for metric type "<metricType>"
        Then the user should receive "AccessDenied" error

        Examples:
          | metricType |
          | bucket     |
          | account    |
          | location   |
