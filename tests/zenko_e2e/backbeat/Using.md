# Quickstart

## Steps

1. In the hosts file `/etc/hosts` map `127.0.0.1` to `zenko.local`. For example,
   by adding the line:

   ```
   127.0.0.1 zenko.local
   ```

2. Create an account using Orbit.
3. Export the access key and secret key of that account (for example, in
   `.secrets.env`):

```
export ZENKO_STORAGE_ACCOUNT_ACCESS_KEY=<zenko-access-key>
export ZENKO_STORAGE_ACCOUNT_SECRET_KEY=<zenko-secret-key>
```

4. Install node and npm.
5. Navigate to `Zenko/tests/zenko_e2e/backbeat`.
6. Install node modules: `npm i`.

### Tests for CRR to AWS:

1. Create a bucket on AWS `<destination-aws-bucket-name>` with versioning
   enabled.
2. In Orbit, create an AWS storage location `<destination-aws-location-name>`
   with an AWS bucket `<destination-aws-bucket-name>`.
3. In Orbit, create an AWS location `<source-aws-location-name>`.
4. Create a container on Azure `<destination-azure-container-name>`.
5. In Orbit, create an Azure storage location
   `<destination-azure-location-name>` with an Azure container
   `<destination-azure-container-name>`.
6. Create a bucket on GCP `<destination-gcp-bucket-name>`.
7. In Orbit, create a GCP storage location
  `<destination-gcp-location-name>` with an GCP bucket
  `<destination-gcp-bucket-name>`.
8. Export the keys, bucket name, container name, and storage location names
   (for example, in `.env` and `.secrets.env`):

```
export AWS_S3_BACKEND_ACCESS_KEY=<aws-access-key>
export AWS_S3_BACKEND_SECRET_KEY=<aws-secret-key>
export AWS_S3_BACKBEAT_BUCKET_NAME=<destination-aws-bucket-name>
export AWS_S3_BACKEND_DESTINATION_LOCATION=<destination-aws-location-name>
export AWS_S3_BACKEND_SOURCE_LOCATION=<source-aws-location-name>
export AZURE_BACKEND_ACCOUNT_NAME=<azure-account-name>
export AZURE_BACKEND_ACCESS_KEY=<azure-access-key>
export AZURE_BACKEND_ENDPOINT=<azure-endpoint>
export AZURE_BACKBEAT_CONTAINER_NAME=<destination-azure-container-name>
export AZURE_BACKEND_DESTINATION_LOCATION=<destination-azure-location-name>
export GCP_CRR_BUCKET_NAME=<destination-gcp-bucket-name>
export GCP_BACKEND_DESTINATION_LOCATION=<destination-gcp-location-name>
export GCP_BACKEND_PRIVATE_KEY=<gcp-private-key>
export GCP_BACKEND_CLIENT_EMAIL=<gcp-client-email>
```

9. If using `*.env` files, source the files:

```
source .env && source .secrets.env
```

10. Create the GCP credential file in `Zenko/tests/zenko_e2e/backbeat`:

```
cat >gcp_key.json <<EOF
{
  "private_key": "${GCP_BACKEND_PRIVATE_KEY}",
  "client_email": "${GCP_BACKEND_CLIENT_EMAIL}"
}
EOF
```

9. Run the test suite: `npm run test_crr`.

### Tests for Backbeat API:

1. Create a bucket on AWS `<destination-aws-bucket-name>` with versioning
   enabled.
2. In Orbit, create an AWS location `<destination-aws-location-name>` with an
   AWS bucket `<destination-aws-bucket-name>`.
3. Export the keys, AWS bucket name, and AWS location (for example, in `.env`
   and `.secrets.env`):

```
export AWS_S3_BACKEND_ACCESS_KEY=<aws-access-key>
export AWS_S3_BACKEND_SECRET_KEY=<aws-secret-key>
export AWS_S3_BACKBEAT_BUCKET_NAME=<destination-aws-bucket-name>
export AWS_S3_BACKEND_DESTINATION_LOCATION=<destination-aws-location-name>
```

4. If using `*.env` files, source the files:

```
source .env && source .secrets.env
```

5. Run the test suite: `npm run test_api`.
