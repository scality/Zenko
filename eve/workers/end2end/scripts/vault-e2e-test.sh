#!/bin/sh

set -exu

DIR=$(dirname $0)

. "$DIR/common.sh"

ZENKO_RESOURCE=${1:-end2end}
NAMESPACE=${2:-default}
DEPS_PATH=${3:-'solution/deps.yaml'}

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

function get_current_vault_tag()
{
    yq eval '.["vault"] | .tag' ${DEPS_PATH}
}

kubectl run $POD_NAME \
  --image registry.scality.com/vault/vault-test:$get_current_vault_tag \
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
  --command -- yarn ft_test
