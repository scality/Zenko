# Quickstart

Steps to run end-to-end tests for CRR to AWS:

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

4. Create a bucket on AWS `<destination-bucket-name>` with versioning enabled.
5. In Orbit, create an AWS location `<destination-location-name>` with an AWS
   `<destination-bucket-name>`.
6. In Orbit, create an AWS location `<source-location-name>`.
7. Export the access key, secret key, AWS bucket name, and AWS location:

```
export AWS_S3_BACKBEAT_ACCESS_KEY=<access-key>
export AWS_S3_BACKBEAT_SECRET_KEY=<secret-key>
export AWS_S3_BACKBEAT_BUCKET_NAME=<destination-bucket-name>
export AWS_DESTINATION_LOCATION=<destination-location-name>
export AWS_SOURCE_LOCATION=<source-location-name>
```

8. Install node and npm.
9. Navigate to `Zenko/tests/zenko_e2e/backbeat`.
10. Install node modules: `npm i`.
11. Run the test suite: `npm run test_crr`.
