#!/bin/sh

set -exu

DIR=$(dirname $0)

. "$DIR/common.sh"

ZENKO_NAME=${1:-end2end}
E2E_IMAGE=${2:-registry.scality.com/zenko/zenko-e2e:latest}
STAGE=${3:-end2end}
NAMESPACE=${4:-default}

POD_NAME="${ZENKO_NAME}-${STAGE}-test"
TOKEN=$(get_token)

# set environment vars
CLOUDSERVER_ENDPOINT="http://${ZENKO_NAME}-connector-s3api.default.svc.cluster.local:80"
BACKBEAT_API_ENDPOINT="http://${ZENKO_NAME}-management-backbeat-api.default.svc.cluster.local:80"
VAULT_ENDPOINT="http://${ZENKO_NAME}-management-vault-iam-admin-api"
ADMIN_ACCESS_KEY_ID=$(kubectl get secret end2end-management-vault-admin-creds.v1 -o jsonpath='{.data.accessKey}' | base64 -d)
ADMIN_SECRET_ACCESS_KEY=$(kubectl get secret end2end-management-vault-admin-creds.v1  -o jsonpath='{.data.secretKey}' | base64 -d)
ZENKO_ACCESS_KEY=$(kubectl get secret end2end-account-zenko -o jsonpath='{.data.AccessKeyId}' | base64 -d)
ZENKO_SECRET_KEY=$(kubectl get secret end2end-account-zenko -o jsonpath='{.data.SecretAccessKey}' | base64 -d)
ZENKO_SESSION_TOKEN=$(kubectl get secret end2end-account-zenko -o jsonpath='{.data.SessionToken}' | base64 -d)
OIDC_FULLNAME="${OIDC_FIRST_NAME} ${OIDC_LAST_NAME}"


run_e2e_test() {
    kubectl run ${1} ${POD_NAME} \
        --image ${E2E_IMAGE} \
        --restart=Never \
        --rm \
        --attach=True \
        --namespace=${NAMESPACE} \
        --image-pull-policy=Always \
        --env=CLOUDSERVER_ENDPOINT=${CLOUDSERVER_ENDPOINT} \
        --env=ZENKO_ACCESS_KEY=${ZENKO_ACCESS_KEY} \
        --env=ZENKO_SECRET_KEY=${ZENKO_SECRET_KEY} \
        --env=ZENKO_SESSION_TOKEN=${ZENKO_SESSION_TOKEN} \
        --env=ADMIN_ACCESS_KEY_ID=${ADMIN_ACCESS_KEY_ID} \
        --env=ADMIN_SECRET_ACCESS_KEY=${ADMIN_SECRET_ACCESS_KEY} \
        --env=VAULT_ENDPOINT=${VAULT_ENDPOINT} \
        --env=TOKEN=${TOKEN} \
        --env=STAGE=${STAGE} \
        --env=CYPRESS_KEYCLOAK_USER_FULLNAME="${OIDC_FULLNAME}" \
        --env=CYPRESS_KEYCLOAK_USERNAME=${OIDC_USERNAME} \
        --env=CYPRESS_KEYCLOAK_PASSWORD=${OIDC_PASSWORD} \
        --env=CYPRESS_KEYCLOAK_ROOT=${OIDC_ENDPOINT} \
        --env=CYPRESS_KEYCLOAK_CLIENT_ID=${OIDC_CLIENT_ID} \
        --env=CYPRESS_KEYCLOAK_REALM=${OIDC_REALM} \
        --env=UI_ENDPOINT=${UI_ENDPOINT} \
        --command -- sh -c "${2}"
}

run_backbeat_tests() {
   EXIT_STATUS="0"

   # Setup our environment
   python3 ../../../tests/zenko_tests/create_buckets.py
   if [ "$?" -ne "0" ]; then
      exit 1
   fi

   run_e2e_test '' 'cd node_tests && npm run test_api test_crr test_crr_pause_resume'

   python3 ../../../tests/zenko_tests/cleans3c.py
}

## TODO use existing entrypoint
if [ "$STAGE" = "end2end" ]; then
   run_e2e_test '' 'cd node_tests && npm run test_operator && npm run test_ui'
elif [ "$STAGE" = "debug" ]; then
   run_e2e_test '-ti' 'bash'
elif [ "$STAGE" = "smoke" ]; then
   run_e2e_test '' 'cd node_tests && npm run test_smoke'
elif [ "$STAGE" = "backbeat" ]; then
   run_backbeat_tests
fi
