Feature: CountItems measures the utilization metrics
  The utilization metrics are computed for accounts, buckets and locations

@2.6.0
@PreMerge
@CronJob
@CountItems
Scenario Outline: Countitems runs without error and compute utilization metrics
    Given an existing bucket "" "without" versioning, "without" ObjectLock "without" retention mode
    And an object "" that "exists"
    When the "CountItems" cronjobs completes without error
    Then the operation finished without error
