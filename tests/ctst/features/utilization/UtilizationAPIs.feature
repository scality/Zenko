Feature: Scality Utilization Reporting (SUR) API
  The utilization metrics API allows different authorized users to retrieve 
  metrics for buckets, accounts, and locations.

    @2.11.0
    @PreMerge
    @Utilization
    @UtilizationAPI
    Scenario Outline: Default roles can retrieve utilization metrics
        Given a STORAGE_MANAGER type
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
    Scenario Outline: IAM users with correct permissions can retrieve utilization metrics
        Given a IAM_USER type
        And an IAM policy attached to the entity "user" with "Allow" effect to perform "sur:GetMetrics" on "arn:scality:sur:::*"
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
        Given a IAM_USER type
        When the user retrieves utilization metrics using scubaclient for metric type "<metricType>"
        Then the user should receive "403" error

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
        Given a IAM_USER type
        And an IAM policy attached to the entity "user" with "Deny" effect to perform "sur:GetMetrics" on "arn:scality:sur:::*"
        When the user retrieves utilization metrics using scubaclient for metric type "<metricType>"
        Then the user should receive "403" error

        Examples:
          | metricType |
          | bucket     |
          | account    |
          | location   |
