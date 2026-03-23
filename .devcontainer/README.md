# Zenko Codespaces
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/scality/Zenko)

A [VS Code extension](https://marketplace.visualstudio.com/items?itemName=GitHub.codespaces) is available for Codespaces.

## Running CTST tests in the codespace

```bash
cd tests/ctst
./run-ctst-locally.sh @yourTag
```

See [tests/ctst/README.md](../tests/ctst/README.md) for more details on building custom images and advanced usage.

## Running e2e tests in the codespace

### Node tests (mocha)

```bash
# Set up the test environment (endpoints, credentials, mongo, TLS)
source .github/scripts/end2end/setup-e2e-env.sh

# Run mocha directly (setup-e2e-env.sh already cd's to node_tests/)
yarn mocha --exit -t 10000 --recursive smoke_tests
yarn mocha --exit -t 10000 --recursive cloudserver/bucketGetV2
yarn mocha --exit -t 10000 --grep "should list objects" --recursive cloudserver/bucketGetV2
```

### CTST tests (cucumber)

```bash
cd tests/ctst
./run-ctst-locally.sh @yourTag
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