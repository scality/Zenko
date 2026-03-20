# Zenko Codespaces
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/scality/Zenko)

A [VS Code extension](https://marketplace.visualstudio.com/items?itemName=GitHub.codespaces) is available for Codespaces.

## Pre-setup: /etc/hosts (local environments only)

When running locally (not in a Codespace/devcontainer where you are root),
the CTST configuration script needs Zenko hostnames to resolve to localhost.
Add them before running setup to avoid a `sudo` prompt mid-run:

```bash
echo "127.0.0.1 iam.zenko.local s3-local-file.zenko.local keycloak.zenko.local sts.zenko.local management.zenko.local s3.zenko.local website.mywebsite.com utilization.zenko.local aws-mock.zenko.local azure-mock.zenko.local blob.azure-mock.zenko.local queue.azure-mock.zenko.local devstoreaccount1.blob.azure-mock.zenko.local devstoreaccount1.queue.azure-mock.zenko.local dr.zenko.local" | sudo tee -a /etc/hosts
```

## Running CTST tests in the codespace

```bash
cd tests/ctst
./run-ctst-locally.sh @yourTag
```

See [tests/ctst/README.md](../tests/ctst/README.md) for more details on building custom images and advanced usage.

## Running e2e tests in the codespace

To run the CTST tests in the codespace, head to `.github/script/end2end/` and run `run-e2e-ctst.sh`
script. Some variables need to be exported before running the tests.

```bash
    env_variables=$(yq eval '.env | to_entries | .[] | .key + "=" + .value' .github/workflows/end2end.yaml | sed 's/\${{[^}]*}}//g') && export $env_variables
    export E2E_IMAGE_TAG=latest
    export GCP_BACKEND_DESTINATION_LOCATION=

    cd .github/scripts/end2end/
    bash run-e2e-test.sh "end2end" ${E2E_IMAGE_NAME}:${E2E_IMAGE_TAG} "backbeat" "default"
```

## Accessing s3 service

This devcontainer is a full Zenko development environment.
Once you start a new Codespace, you will have a full Zenko stack running in Kubernetes after a few minutes.

After deployment is done, which you can follow by opening another terminal, you will be able to access S3 service through a port-forward.
First find a cloudserver connector using the following command:

```bash
    kubectl get pods
```

Then port-forward the connector

```bash
    kubectl port-forward pod/end2end-connector-cloudserver-XXXXXXX 8080
```

After that you will need Access Key and Secret Key which you can find with the following commands

```bash
    export ACCESS_KEY=$(kubectl get secret end2end-management-vault-admin-creds.v1 -o jsonpath='{.data.accessKey}' | base64 -d)
    export SECRET_KEY=$(kubectl get secret end2end-management-vault-admin-creds.v1  -o jsonpath='{.data.secretKey}' | base64 -d)
```

Then configure aws cli with the following command

```bash
    aws configure set aws_access_key_id $ACCESS_KEY
    aws configure set aws_secret_access_key $SECRET_KEY
    aws configure set region us-east-1
```

Now you can use aws cli to interact with the S3 service

```bash
    aws s3 ls --endpoint http://localhost:8080
```

## Troubleshooting

### Inspecting Codespace creation logs

You can inspect the logs of the Codespace creation this way:
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Codespaces: Export Logs" and select it
3. A zip file will be downloaded to your local machine
4. In the zip, look at the `creation.log` file