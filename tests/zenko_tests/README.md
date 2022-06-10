# Table of contents
- [How to write iam policy e2e tests](#how-to-write-iam-policy-e2e-tests)
- [How to run zenko end2end test locally with zenko-operator](#how-to-run-zenko-end2end-test-locally-with-zenko-operator)
- [How to run zenko end2end test locally with cloudserver and vault](#how-to-run-zenko-end2end-test-locally-with-cloudserver-and-vault)


# How to write iam policy e2e tests

All iam policy controlled tests go under `node_tests/iam_policies`,
then tests are split into different projects like `cloudserver` and `backbeat`
which need to interact with `Vault` for iam policy check.

```
node_tests
└───backbeat
└───cloudserver
└───iam_policies
│   │
│   └───cloudserver
│   │   │   AssumeRole.js
│   │   │   AssumeRoleWithWebIdentity.js
│   │   │   IAMUser.js
│   │
│   └───backbeat
│       │   ...
│   
└───smoke_tests
└───ui
└───utils
└───...
```

Under each project ex. cloudserver, we have 3 test files that represent
3 different entities that need iam permissions to perform operations.
- IAM user
- AssumeRole session uer
- AssumeRoleWithWebIdentity session user

In each test file, the test frameworks are defined generically
for all s3 APIs' permission tests.
For example, in `AssumeRoleWithWebIdentity.js`, the test process
is like this:
- Create an account, use this account to create a bucket,
and put an object into it.
- Get web token from keycloak for Storage Manager user,
Storage Account Owner user or Data Consumer user.
- Assume Storage Manager role, Storage Account Owner role
or Data Consumer role using the web token.
- Use the temporary credentials returned by AssumeRoleWWI
to perform the action you want to test and check if the response is expected.

Whenever we need to add iam permission tests for a new API, we just add API in [testAPIs list](node_tests/iam_policies/cloudserver/AssumeRoleWithWebIdentity.js#L55), and also define its [request](node_tests/iam_policies/cloudserver/utils.js#L35) with minimum required parameters(query and body).
We follow the AWS standard, so we can always refer to [aws s3 API documentation](https://docs.aws.amazon.com/AmazonS3/latest/API/API_Operations_Amazon_Simple_Storage_Service.html) for more details about API request syntax.

Note: Instead of checking if the response is a success, we only check code not equal to AccessDenied.
Because permission check is the first error returned except for missing required parameters error, if we can provide a minimum required query and body for requests, we don't necessarily have to provide the exact correct context and params to get a successful response.
It doesn't matter if we get other errors like MalFormedACLError or NoSuchCORSConfiguration etc., because these errors always happen after checking its permission.

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

### Access mongodb

#### Get MongoDB credentials

```shell
$ kubectl get secret mongodb-db-creds -o jsonpath={.data.mongodb-username} | base64 -d
$ kubectl get secret mongodb-db-creds -o jsonpath={.data.mongodb-password} | base64 -d
```

#### Forward mongodb port from inside cluster to local
```shell
$ kubectl port-forward dev-db-mongodb-primary-0 27021:27017
```
Connect to `localhost:27021` with database `admin` and `username/password` got from above using your local MongoDB GUI (Robo3T, MongoDB Compass, etc...)

# How to run zenko end2end test locally with cloudserver and vault

## Prerequisite

- docker
- redis
- mongodb image from scality/ci-mongo
- A local Vault cloned repository with your ongoing modifications

## Set up mongodb
```shell
$ docker run -d --net=host --name ci-mongo scality/ci-mongo
```

### Set up keycloak

First, cd to the Vault repository
```shell
$ cd <vault_repository_folder>/.github/docker/keycloak
```

Then build your Keycloak image:
```shell
$ docker build -t keycloak .
```

Create a configuration file for Keycloak:
```shell
$ cat <<EOF > env.list
KEYCLOAK_REALM=myrealm
KEYCLOAK_CLIENT_ID=myclient
KEYCLOAK_USERNAME=bartsimpson
KEYCLOAK_PASSWORD=123
KEYCLOAK_USER_FIRSTNAME=Bart
KEYCLOAK_USER_LASTNAME=Simpson
EOF
```

Finally, you can run your keycloak image locally:
```shell
$ docker run -p 8443:8443 -p 8080:8080 --env-file env.list -it -e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=admin  keycloak
```

### Run clouserver

```shell
$ S3METADATA=mongodb REMOTE_MANAGEMENT_DISABLE=1 S3BACKEND=mem S3VAULT=multiple node index.js
```

### Run Vault

```shell
$ VAULT_DB_BACKEND=MONGODB yarn start
```

### Generate account and account access key using vaultclient

Under vault root folder
```shell
$ ADMIN_ACCESS_KEY_ID="D4IT2AWSB588GO5J9T00" ADMIN_SECRET_ACCESS_KEY="UEEu8tYlsOGGrgf4DAiSZD6apVNPUWqRiPG0nTB6" ./node_modules/vaultclient/bin/vaultclient create-account -name account --email acc@ount.fr --port 8600
$ ADMIN_ACCESS_KEY_ID="D4IT2AWSB588GO5J9T00" ADMIN_SECRET_ACCESS_KEY="UEEu8tYlsOGGrgf4DAiSZD6apVNPUWqRiPG0nTB6" ./node_modules/vaultclient/bin/vaultclient generate-account-access-key --name account --port 8600
```

### Run end2end tests

```shell
$ KEYCLOAK_TEST_HOST=http://localhost \
KEYCLOAK_TEST_PORT=8080 \
KEYCLOAK_TEST_REALM_NAME=myrealm \
KEYCLOAK_TEST_CLIENT_ID=myclient \
CLOUDSERVER_ENDPOINT=http://127.0.0.1:8000 \
CLOUDSERVER_HOST=127.0.0.1 \
CLOUDSERVER_PORT=8000 \
VAULT_STS_ENDPOINT=http://127.0.0.1:8800 \
VAULT_ENDPOINT=http://127.0.0.1:8600 \
ZENKO_ACCESS_KEY=<account access key generated previously> \
ZENKO_SECRET_KEY=<account secret key generated previously> \
ADMIN_ACCESS_KEY_ID=D4IT2AWSB588GO5J9T00 \
ADMIN_SECRET_ACCESS_KEY=UEEu8tYlsOGGrgf4DAiSZD6apVNPUWqRiPG0nTB6 \
yarn test_iam_policies
```
