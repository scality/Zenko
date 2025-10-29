# Quickstart

## Steps

1. In the hosts file `/etc/hosts` map the ip of the kube node you are testing
   with to `zenko.local`. For example, by adding the line:

   ```
   <kubernetes-IP> zenko.local
   ```

   If you are ssh-ed into one of the kube servers or doing a port-forward to a
   remote kube instance, the `kube-node-ip` value will be `127.0.0.1`

2. Find the Zenko service endpoint for S3 calls to Cloudserver by running:

   ```
   kubectl get services
   ```

   Look for the service named `zenko-cloudserver`, the value under `NAME` should
   be set as the Zenko endpoint for testing:

   ```
   export CLOUDSERVER_ENDPOINT=http://<zenko-cloudserver-IP>
   export CLOUDSERVER_HOST=<zenko-cloudserver-IP>
   ```

3. Create an account using Orbit.
4. Export the access key and secret key of that account (for example, in
   `.secrets.env`):

    ```
    export ZENKO_ACCESS_KEY=<zenko-access-key>
    export ZENKO_SECRET_KEY=<zenko-secret-key>
    ```

5. Install node and npm.
6. Navigate to `Zenko/tests/node_tests/backbeat`.
7. Install node modules: `npm i`.

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
    export AWS_ACCESS_KEY=<aws-access-key>
    export AWS_SECRET_KEY=<aws-secret-key>
    export AWS_CRR_BUCKET_NAME=<destination-aws-bucket-name>
    export AWS_BACKEND_DESTINATION_LOCATION=<destination-aws-location-name>
    export AWS_BACKEND_SOURCE_LOCATION=<source-aws-location-name>
    export AZURE_ACCOUNT_NAME=<azure-account-name>
    export AZURE_SECRET_KEY=<azure-access-key>
    export AZURE_BACKEND_ENDPOINT=<azure-endpoint>
    export AZURE_CRR_BUCKET_NAME=<destination-azure-container-name>
    export AZURE_BACKEND_DESTINATION_LOCATION=<destination-azure-location-name>
    export GCP_CRR_BUCKET_NAME=<destination-gcp-bucket-name>
    export GCP_BACKEND_DESTINATION_LOCATION=<destination-gcp-location-name>
    export GCP_BACKEND_SERVICE_KEY=<gcp-private-key>
    export GCP_BACKEND_SERVICE_EMAIL=<gcp-client-email>
    ```

9. If using `*.env` files, source the files:

    ```
    source .env && source .secrets.env
    ```

10. Create the GCP credential file in `Zenko/tests/zenko_e2e/backbeat`:

    ```
    cat >gcp_key.json <<EOF
    {
      "private_key": "${GCP_BACKEND_SERVICE_KEY}",
      "client_email": "${GCP_BACKEND_SERVICE_EMAIL}"
    }
    EOF
    ```

9. Run the test suite: `npm run test_crr`.

### Tests for Backbeat API and CRR Pause Resume:

1. Create a bucket on AWS `<destination-aws-bucket-name>` with versioning
   enabled.
2. In Orbit, create an AWS location `<destination-aws-location-name>` with an
   AWS bucket `<destination-aws-bucket-name>`.
3. Create a container on Azure `<destination-azure-container-name>`.
4. In Orbit, create an Azure storage location
  `<destination-azure-location-name>` with an Azure container
  `<destination-azure-container-name>`.
5. Export the keys, AWS bucket name, and AWS location (for example, in `.env`
   and `.secrets.env`):

    ```
    export CLOUDSERVER_HOST=<zenko-cloudserver-name>
    export AWS_ACCESS_KEY=<aws-access-key>
    export AWS_SECRET_KEY=<aws-secret-key>
    export AWS_CRR_BUCKET_NAME=<destination-aws-bucket-name>
    export AWS_BACKEND_DESTINATION_LOCATION=<destination-aws-location-name>
    export AZURE_ACCOUNT_NAME=<azure-account-name>
    export AZURE_SECRET_KEY=<azure-access-key>
    export AZURE_BACKEND_ENDPOINT=<azure-endpoint>
    export AZURE_CRR_BUCKET_NAME=<destination-azure-container-name>
    export AZURE_BACKEND_DESTINATION_LOCATION=<destination-azure-location-name>
    ```

6. If using `*.env` files, source the files:

    ```
    source .env && source .secrets.env
    ```

7. Run the test suite: `npm run test_api` for API tests, or
   `npm run test_crr_pause_resume` for CRR pause and resume tests.

### Retry tests

1. Create a bucket on AWS `<destination-fail-aws-bucket-name>` with versioning
   enabled.
2. In Orbit, create an AWS location `<destination-fail-aws-location-name>` with
   an AWS bucket `<destination-fail-aws-bucket-name>`.
3. Export the keys, AWS bucket name, and AWS location (for example, in `.env`
   and `.secrets.env`):

```
export AWS_ACCESS_KEY=<aws-access-key>
export AWS_SECRET_KEY=<aws-secret-key>
export AWS_S3_FAIL_BACKBEAT_BUCKET_NAME=<destination-fail-aws-bucket-name>
export AWS_S3_FAIL_BACKEND_DESTINATION_LOCATION=<destination-fail-aws-bucket-name>
```

4. If using `*.env` files, source the files:

```
source .env && source .secrets.env
```

5. Run the test suite: `npm run test_retry`.
