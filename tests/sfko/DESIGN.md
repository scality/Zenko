# SFKO - I am become death, destroyer of clusters

## Tested Functions

* GET
* PUT
* MPU
* Replication
* Transient Source
* Lifecycle

## Tested Backends

* AWS
* Azure
* GCS
* sproxyd
* S3C

## Testing Strategy

* Pick functionality to test
* Pick backends according to requirements
* Generate random workload
* Prepare environment
* Run workload
* Monitor successes/failures
* Mark test as PASSED/FAILED


## Test features

* Provides Setup function
* Provides test function
* Provides check function
* Spec requirements for execution
    * required backends
    * required buckets
    * required replication/lifecycle config


## Scenario Spec
Groups test parameters together to form a unique combination of worload/config

* required - Define requiremnts for this scenario
    * buckets - `int||list` Number of zenko buckets needed, pass a list to configure individual buckets
        * replication - `str` Enable replication on the buckets
        * transient - `bool` Enable transient source on buckets **This requires a bucket backed by s3-data, and will ignore `clouds` if set**
        * expiration - `duration` Enable lifecycle expiration on the buckets. **If present this key should contain a time duration eg: `5h 30m`
        * clouds - `list` Restrict this scenario to backends on the passed clouds
* tests - `list` Workloads to run against the configured buckets
* checks - `list` Checks to run after workload is complete


## Execution Stages

* Load backends, secrets, scenarios
* Pick scenario to test
* Resolve configuration
    * Generate name
    * Choose backends for needed buckets
    * Create Zenko buckets
    * Setup needed replication/transient source/etc
* Execute test functions
* Execute check functions
* Cleanup Environment
* Report results


# Monitoring tests

* Check inbound connections for patterns matching zenko ops
    * Check HTTP Method
        * PUT
        *
* When found check completion based on return value
* push status to redis to persist results, to be queried by check function



## Test scenarios

* Failure tests
    * Incomplete uploads (kill upload ??)
    * Node node failures (openstack api)
    * Pod failures (k8s api)
    * Network (iptables)

* Counts
* File sizes
    * 0B - A Bunch
    * 512K - 500000
    * 1M - 50000
    * 10M - 100000
    * 100G - 10


## Checks

* Service Integrity (helm test)
* Upgrade and Rollbacks
* /var disk usage
