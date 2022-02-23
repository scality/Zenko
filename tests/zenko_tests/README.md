# How to run zenko end2end test locally with zenko-operator

_For Backbeat tests please see [Using.md](./node_tests/backbeat/Using.md)_
## Prerequisite

_All with their latest version_
- Docker
- Kubectl
- Helm
- Tilt
- Kind
- m4
- git


## Deploy zenko environment

### Login to docker registry
    Zenko-operator deployment will need to access private images from the scality registry.

You will need to connect to Harbor, then go into your user profile to generate a “CLI secret”, which you will user as password

Then login from CLI, using your registry Username and the CLI secret you just generated as password:


```shell
$ docker login registry.scality.com
User name: <Username on registry.scality.com>
Password: <Generated CLI secret>
```

***
### Download zenko operator from git repository

```shell
$ git clone https://github.com/scality/zenko-operator.git
$ cd zenko-operator
```
***
### Adapt config to create ingress for s3api endpoint

Edit file `/doc/examples/zenko-1.2-dev.yaml` by adding this at the end of the file

```yaml
initialConfiguration:
    locations:
    - name: us-east-1
      type: location-file-v1
    s3API:
      endpoints:
      - hostname: s3.zenko.local
        locationName: us-east-1
```

***
### Change versions to suit your needs

Edit file `/doc/examples/zenkoversion-1.2-dev.yaml` by changing the versions

_For example:_
```diff
vault:
  image: registry.scality.com/vault/vault
-      tag: '8.3.6'
+      tag: '8.4.0'
  shell:
    image: busybox

```
***

### Run zenko operator

Run the script:

`./hack/scripts/bootstrap-kind-dev.sh`

<hr style="border:2px solid gray"/>

## Configure env to run end2end tests

#### Get access key

```shell
$ export ADMIN_ACCESS_KEY=$(kubectl get secret dev-management-vault-admin-creds.v1  -n default -o  jsonpath='{.data.accessKey}' | base64 -d)
```

#### Get secret key

```shell
$ export ADMIN_SECRET_KEY=$(kubectl get secret dev-management-vault-admin-creds.v1  -n default -o  jsonpath='{.data.secretKey}' | base64 -d)
```

#### Edit hosts file
```shell
$ sudo vi /etc/hosts
# add this line:
127.0.0.1  iam.zenko.local ui.zenko.local s3-local-file.zenko.local keycloak.zenko.local sts.zenko.local management.zenko.local s3.zenko.local
```
#### Come to your local vaultclient root folder and create an account and generate access key
```shell
$ ADMIN_ACCESS_KEY_ID=$ADMIN_ACCESS_KEY ADMIN_SECRET_ACCESS_KEY=$ADMIN_SECRET_KEY ./bin/vaultclient create-account --name account --email acc@ount.fr --host iam.zenko.local --port 80
$ ADMIN_ACCESS_KEY_ID=$ADMIN_ACCESS_KEY ADMIN_SECRET_ACCESS_KEY=$ADMIN_SECRET_KEY ./bin/vaultclient generate-account-access-key --name account --host iam.zenko.local --port 80
```

### Export endpoints in env

```shell
$ export ZENKO_ACCESS_KEY=<access key generated previously>
$ export ZENKO_SECRET_KEY=<secret key generated previously>
$ export CLOUDSERVER_ENDPOINT=http://s3.zenko.local:80
$ export VAULT_ENDPOINT=http://iam.zenko.local:80
$ export VAULT_STS_ENDPOINT=http://sts.zenko.local:80
$ export CLOUDSERVER_HOST=s3.zenko.local #No http and port here
```

### Run end2end tests

```shell
$ git clone git@github.com:scality/zenko
$ cd zenko/tests/node_tests
#Using node 16
$ yarn install
$ yarn run test_iam_policies
```