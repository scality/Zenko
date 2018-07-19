# Quickstart

## Steps

1. In the hosts file `/etc/hosts` map `127.0.0.1` to `zenko.local`. For example,
   by adding the line:

   ```
   127.0.0.1 zenko.local
   ```

2. Create an account using Orbit.
3. Export the access key and secret key of that account:

```
export ZENKO_BACKBEAT_ACCESS_KEY=<access-key>
export ZENKO_BACKBEAT_SECRET_KEY=<secret-key>
```

3. Install node and npm.
4. Navigate to `Zenko/tests/zenko_e2e/backbeat`.
5. Install node modules: `npm i`.

### Tests for CRR to AWS:

1. Create a bucket on AWS `<destination-bucket-name>` with versioning enabled.
2. In Orbit, create an AWS location `<destination-location-name>` with an AWS
   `<destination-bucket-name>`.
3. In Orbit, create an AWS location `<source-location-name>`.
4. Export the access key, secret key, AWS bucket name, and AWS location:

```
export AWS_S3_BACKBEAT_ACCESS_KEY=<access-key>
export AWS_S3_BACKBEAT_SECRET_KEY=<secret-key>
export AWS_S3_BACKBEAT_BUCKET_NAME=<destination-bucket-name>
export AWS_DESTINATION_LOCATION=<destination-location-name>
export AWS_SOURCE_LOCATION=<source-location-name>
```

5. Run the test suite: `npm run test_crr`.

### Tests for Backbeat API:

1. Create a bucket on AWS `<destination-bucket-name>` with versioning enabled.
2. In Orbit, create an AWS location `<destination-location-name>` with an AWS
   `<destination-bucket-name>`.
3. Export the access key, secret key, AWS bucket name, and AWS location:

```
export AWS_S3_BACKBEAT_ACCESS_KEY=<access-key>
export AWS_S3_BACKBEAT_SECRET_KEY=<secret-key>
export AWS_S3_BACKBEAT_BUCKET_NAME=<destination-bucket-name>
export AWS_DESTINATION_LOCATION=<destination-location-name>
```

4. Run the test suite: `npm run test_api`.
