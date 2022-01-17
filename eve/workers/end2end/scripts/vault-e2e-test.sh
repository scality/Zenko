#!/bin/sh

set -exu

DIR=$(dirname $0)

. "$DIR/common.sh"

ZENKO_RESOURCE=${1:-end2end}
NAMESPACE=${2:-default}

POD_NAME="${ZENKO_RESOURCE}-vault-test"

# set environment vars
VAULT_ENDPOINT="http://${ZENKO_RESOURCE}-management-vault-iam-admin-api:80"
VAULT_METRICS_ENDPOINT="http://${ZENKO_RESOURCE}-connector-vault-metrics:8501"
VAULT_STS_ENDPOINT="http://${ZENKO_RESOURCE}-connector-vault-sts-api:80"
VAULT_AUTH_ENDPOINT="http://${ZENKO_RESOURCE}-connector-vault-auth-api:80"
ADMIN_ACCESS_KEY_ID=$(kubectl get secret $ZENKO_RESOURCE-management-vault-admin-creds.v1 -n $NAMESPACE -o  jsonpath='{.data.accessKey}' | base64 -d)
ADMIN_SECRET_ACCESS_KEY=$(kubectl get secret $ZENKO_RESOURCE-management-vault-admin-creds.v1 -n $NAMESPACE -o  jsonpath='{.data.secretKey}' | base64 -d)
MONGODB_TEST_HOST="dev-db-mongodb-primary-0.dev-db-mongodb-headless.default.svc.cluster.local"
MONGODB_TEST_PORT="27017"
MONGODB_TEST_USER=$(kubectl get secret mongodb-db-creds -n $NAMESPACE -o jsonpath='{.data.mongodb-username}' | base64 -d)
MONGODB_TEST_PASSWORD=$(kubectl get secret mongodb-db-creds -n $NAMESPACE -o jsonpath='{.data.mongodb-password}' | base64 -d)
MONGODB_TEST_DATABASE=$(kubectl get secret mongodb-db-creds -n $NAMESPACE -o jsonpath='{.data.mongodb-database}' | base64 -d)
REDIS_TEST_HOST="${ZENKO_RESOURCE}-base-cache"
REDIS_TEST_PORT="6379"
REDIS_TEST_PASSWORD=$(kubectl get secret $ZENKO_RESOURCE-base-cache-creds.v1 -n $NAMESPACE -o jsonpath='{.data.password}' | base64 -d)
ZENKO_VERSION=$(kubectl get zenko $ZENKO_RESOURCE -n $NAMESPACE -o jsonpath='{.spec.version}')
VAULT_TEST_TAG="killian3"
VAULT_TEST_IMAGE="registry.scality.com/playground/wlardier/vault"
KEYCLOAK_TEST_USER="${OIDC_USERNAME}-norights"
KEYCLOAK_TEST_PASSWORD=${OIDC_PASSWORD}
KEYCLOAK_TEST_HOST=${OIDC_ENDPOINT}
KEYCLOAK_TEST_PORT="443"
KEYCLOAK_TEST_REALM_NAME=${OIDC_REALM}
KEYCLOAK_TEST_CLIENT_ID=${OIDC_CLIENT_ID}
KEYCLOAK_TEST_GRANT_TYPE="password"
VAULT_TEST_CONFIG=$(kubectl get secret $ZENKO_RESOURCE-management-vault-config.v0 -o jsonpath='{.data.config\.json}' | base64 -d)
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
  --env="VAULT_METRICS_ENDPOINT=${VAULT_METRICS_ENDPOINT}" \
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
  --env="KEYCLOAK_TEST_USER=${KEYCLOAK_TEST_USER}" \
  --env="KEYCLOAK_TEST_PASSWORD=${KEYCLOAK_TEST_PASSWORD}" \
  --env="KEYCLOAK_TEST_HOST=${KEYCLOAK_TEST_HOST}" \
  --env="KEYCLOAK_TEST_PORT=${KEYCLOAK_TEST_PORT}" \
  --env="KEYCLOAK_TEST_REALM_NAME=${KEYCLOAK_TEST_REALM_NAME}" \
  --env="KEYCLOAK_TEST_CLIENT_ID=${KEYCLOAK_TEST_CLIENT_ID}" \
  --env="KEYCLOAK_TEST_GRANT_TYPE=${KEYCLOAK_TEST_GRANT_TYPE}" \
  --env="VAULT_TEST_CONFIG=${VAULT_TEST_CONFIG}" \
  --env="VAULT_OIDC_TEST=${VAULT_OIDC_TEST}" \
  --command -- yarn ft_test
