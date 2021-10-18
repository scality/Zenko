#!/bin/sh

set -exu

DIR=$(dirname $0)

. "$DIR/common.sh"

ZENKO_RESOURCE=${1:-end2end}
NAMESPACE=${2:-default}

POD_NAME="${ZENKO_RESOURCE}-vault-test"

# set environment vars
VAULT_ENDPOINT="http://${ZENKO_RESOURCE}-management-vault-iam-admin-api:80"
VAULT_STS_ENDPOINT="http://${ZENKO_RESOURCE}-connector-vault-sts-api:80"
VAULT_AUTH_ENDPOINT="http://${ZENKO_RESOURCE}-connector-vault-auth-api:80"
ADMIN_ACCESS_KEY_ID=$(kubectl get secret $ZENKO_RESOURCE-management-vault-admin-creds.v1 -n $NAMESPACE -o  jsonpath='{.data.accessKey}' | base64 -d)
ADMIN_SECRET_ACCESS_KEY=$(kubectl get secret $ZENKO_RESOURCE-management-vault-admin-creds.v1 -n $NAMESPACE -o  jsonpath='{.data.secretKey}' | base64 -d)
MONGODB_TEST_HOST="${ZENKO_RESOURCE}-base-db"
MONGODB_TEST_PORT="27017"
MONGODB_TEST_USER=$(kubectl get secret $ZENKO_RESOURCE-base-db-auth -n $NAMESPACE -o jsonpath='{.data.username}' | base64 -d)
MONGODB_TEST_PASSWORD=$(kubectl get secret $ZENKO_RESOURCE-base-db-auth -n $NAMESPACE -o jsonpath='{.data.password}' | base64 -d)
MONGODB_TEST_DATABASE=$(kubectl get zenko $ZENKO_RESOURCE -n $NAMESPACE -o jsonpath='{.status.instanceID}')
REDIS_TEST_HOST="${ZENKO_RESOURCE}-base-cache"
REDIS_TEST_PORT="6379"
REDIS_TEST_PASSWORD=$(kubectl get secret $ZENKO_RESOURCE-base-cache-creds.v1 -n $NAMESPACE -o jsonpath='{.data.password}' | base64 -d)
ZENKO_VERSION=$(kubectl get zenko $ZENKO_RESOURCE -n $NAMESPACE -o jsonpath='{.spec.version}')
VAULT_TEST_TAG=$(kubectl get zenkoversion $ZENKO_VERSION  -n $NAMESPACE -o jsonpath='{.spec.versions.vault.tag}')
VAULT_TEST_IMAGE="registry.scality.com/vault/vault-test"
USER_1_NAME="bartsimpson"
USER_1_PASSWORD="123"
HOST_1_URL="127.0.0.1"
HOST_1_PORT="8443"
REALM_NAME="myrealm"
KEYCLOAK_PATH="/auth/realms/${REALM_NAME}/protocol/openid-connect/token"
KEYCLOAK_TEST_CLIENT_ID="myclient"
KEYCLOAK_TEST_GRANT_TYPE="password"
VAULT_OIDC_TEST="1"


# in case of force builds image and tag can be specified using "Extra properties":
# 'vault_test_image_name' and 'vault_test_image_tag'
if [ ! -z "$VAULT_TEST_IMAGE_NAME" ] ; then
  VAULT_TEST_IMAGE=$VAULT_TEST_IMAGE_NAME
fi
if [ ! -z "$VAULT_TEST_IMAGE_TAG" ] ; then
  VAULT_TEST_TAG=$VAULT_TEST_IMAGE_TAG
fi

kubectl run $POD_NAME \
  --image $VAULT_TEST_IMAGE:$VAULT_TEST_TAG \
  --rm \
  --attach=True \
  --restart=Never \
  --namespace=$NAMESPACE \
  --env="VAULT_ENDPOINT=${VAULT_ENDPOINT}" \
  --env="VAULT_STS_ENDPOINT=${VAULT_STS_ENDPOINT}" \
  --env="VAULT_AUTH_ENDPOINT=${VAULT_AUTH_ENDPOINT}" \
  --env="ADMIN_ACCESS_KEY_ID=${ADMIN_ACCESS_KEY_ID}" \
  --env="ADMIN_SECRET_ACCESS_KEY=${ADMIN_SECRET_ACCESS_KEY}" \
  --env="MONGODB_TEST_HOST=${MONGODB_TEST_HOST}" \
  --env="MONGODB_TEST_PORT=${MONGODB_TEST_PORT}" \
  --env="MONGODB_TEST_USER=${MONGODB_TEST_USER}" \
  --env="MONGODB_TEST_PASSWORD=${MONGODB_TEST_PASSWORD}" \
  --env="MONGODB_TEST_DATABASE=${MONGODB_TEST_DATABASE}" \
  --env="REDIS_TEST_HOST=${REDIS_TEST_HOST}" \
  --env="REDIS_TEST_PORT=${REDIS_TEST_PORT}" \
  --env="REDIS_TEST_PASSWORD=${REDIS_TEST_PASSWORD}" \
  --env="USER_1_NAME=${USER_1_NAME}" \
  --env="USER_1_PASSWORD=${USER_1_PASSWORD}" \
  --env="HOST_1_URL=${HOST_1_URL}" \
  --env="HOST_1_PORT=${HOST_1_PORT}" \
  --env="REALM_NAME=${REALM_NAME}" \
  --env="KEYCLOAK_PATH=${KEYCLOAK_PATH}" \
  --env="KEYCLOAK_TEST_CLIENT_ID=${KEYCLOAK_TEST_CLIENT_ID}" \
  --env="KEYCLOAK_TEST_GRANT_TYPE=${KEYCLOAK_TEST_GRANT_TYPE}" \
  --env="VAULT_OIDC_TEST=${VAULT_OIDC_TEST}" \
  --command -- yarn ft_test
