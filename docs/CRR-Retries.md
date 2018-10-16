# Automated CRR Retry and Retry Tunables per cloud

## Tunable retries per cloud

The following are the parameters available to tune retries per cloud

**Note**: These tuneables are meant to cover interim failures (both retryable errors such as TCP errors and non-retryable errors such as invalid credentials).
If a location is experiencing extended outage, the recommended approach is to pause the location in Orbit and enable it when the cloud location's service
is restored. If the location is not paused during extended outage, objects will be retried a few times but eventually failing permanently.

- `maxRetries` - maximum number of retries allowed per object
- `timeoutS` - total timeout period upto when the retries can occur since the first retry started
- Backoff Params
  - `backoff.min` - minimum amount of time in milliseconds to backoff
  - `backoff.max` - maximum amount of time in milliseconds to backoff
  - `backoff.jitter` - randomness for backoff to avoid overwhelming the target with heavy number of retries at the same time
  - `backoff.factor` - length of delay for backoff is arrived multiplying by the factor, this is used in the algo to backoff exponentially

### Retry behavior

During CRR if any error occurs uploading the object, the object will be retried a few times before setting it as failed permanently.
When an object enters into retry mode, the operation is retried upto either `maxRetries` or `timeoutS`, whichever occurs earlier. Both of these values are important because retries happen quickly for 0-byte objects vs. objects with data associated with them. An object is guaranteed to be retried at least once regardless of any of the tunables.
Backoff params are using in calculating the time to backoff, giving the value in milliseconds upto `backoff.max`.

These values are configurable in the kubernetes charts. The following section can be added in Zenko/Kubernetes/options.yaml file. The values given here reflect the current defaults.

```yaml
backbeat:
  replication:
    dataProcessor:
      retry:
        aws_s3:
          timeoutS: 900
          maxRetries: 5
          backoff:
            min: 60000
            max: 900000
            jitter: 0.1
            factor: 1.5
        azure:
          timeoutS: 900
          maxRetries: 5
          backoff:
            min: 60000
            max: 900000
            jitter: 0.1
            factor: 1.5
        gcp:
          timeoutS: 900
          maxRetries: 5
          backoff:
            min: 60000
            max: 900000
            jitter: 0.1
            factor: 1.5
```

## Automatic failures retry

This feature is applied as a background task running every `n` minutes (configurable, 10 minutes by default).
A temporary pod is spawned every `n` minutes which lists failed crr per location and submits them for retry.
Cronjobs are configurable in Kubernetes dashboard under `Cron Jobs` section.

## Delete objects

This script is available in `s3utils` pod. The script can be run as follows

- Exec into the pod using `kubectl exec -it s3utils bash`

- Run the cleanup script as `node cleanupBuckets.js <bucket1> <bucket2> ...`

This script works on versioned buckets where it deletes both current and archived
versions, delete markers and aborts any ongoing multipart uploads. The buckets are only cleaned up,
they are not deleted.
