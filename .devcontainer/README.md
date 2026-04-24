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
bash .github/scripts/end2end/run-e2e-ctst.sh @yourTag
```

See [tests/functional/ctst/README.md](../tests/functional/ctst/README.md) for more details.

## Running e2e tests in the codespace

### Node tests (mocha)

```bash
# Set up the test environment (endpoints, credentials, mongo, TLS)
# SKIP_CTST=1 skips Kafka/notification/CTST-specific setup (not needed for mocha tests)
SKIP_CTST=1 source .github/scripts/end2end/setup-e2e-env.sh

# Run mocha directly (setup-e2e-env.sh already cd's to node_tests/)
yarn mocha --exit -t 10000 --recursive smoke_tests
yarn mocha --exit -t 10000 --recursive cloudserver/bucketGetV2
yarn mocha --exit -t 10000 --grep "should list objects" --recursive cloudserver/bucketGetV2
```

### CTST tests (cucumber)

```bash
bash .github/scripts/end2end/run-e2e-ctst.sh @yourTag
```

## Accessing s3 service

This devcontainer is a full Zenko development environment.
Once you start a new Codespace, you will have a full Zenko stack running in Kubernetes after a few minutes.

After deployment is done, the devcontainer setup configures ingress endpoints and `/etc/hosts` entries
for out-of-cluster access. You can access the S3 service at `http://s3.zenko.local`.

Get credentials:

```bash
export ACCESS_KEY=$(kubectl get secret end2end-management-vault-admin-creds.v1 -o jsonpath='{.data.accessKey}' | base64 -d)
export SECRET_KEY=$(kubectl get secret end2end-management-vault-admin-creds.v1  -o jsonpath='{.data.secretKey}' | base64 -d)
```

Configure the AWS CLI:

```bash
aws configure set aws_access_key_id $ACCESS_KEY
aws configure set aws_secret_access_key $SECRET_KEY
aws configure set region us-east-1
aws configure set endpoint_url http://s3.zenko.local
```

Use it:

```bash
aws s3 ls
```

## Troubleshooting

### Know Issues

Credentials for storage_manager will stop working when the Codespace is older than 12h
This is because we do an assume role in accounts.py with a max duration of 12h

### Inspecting Codespace creation logs

You can inspect the logs of the Codespace creation in 2 ways way:
1. When Codespace creation is still running : 
Use Cmd/Ctrl + Shift + P -> View Creation Log to see full logs 

2. When the setup is finished, dump the logs : 
a. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
b. Type "Codespaces: Export Logs" and select it
c. A zip file will be downloaded to your local machine
d. In the zip, look at the `creation.log` file