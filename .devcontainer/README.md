# Zenko Codespaces
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/scality/Zenko)

## Running CTST tests in the codespace

To run the CTST tests in the codespace, simply head to `.github/script/end2end/` and run `run-e2e-ctst.sh` script.

```bash
    cd .github/script/end2end/
    bash run-e2e-ctst.sh
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