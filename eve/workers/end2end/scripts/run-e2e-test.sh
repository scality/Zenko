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
CLOUDSERVER_HOST="${ZENKO_NAME}-connector-s3api.default.svc.cluster.local"
CLOUDSERVER_ENDPOINT="http://${CLOUDSERVER_HOST}:80"
BACKBEAT_API_ENDPOINT="http://${ZENKO_NAME}-management-backbeat-api.default.svc.cluster.local:80"
VAULT_ENDPOINT="http://${ZENKO_NAME}-management-vault-iam-admin-api:80"
VAULT_STS_ENDPOINT="http://${ZENKO_NAME}-connector-vault-sts-api:80"
ADMIN_ACCESS_KEY_ID=$(kubectl get secret end2end-management-vault-admin-creds.v1 -o jsonpath='{.data.accessKey}' | base64 -d)
ADMIN_SECRET_ACCESS_KEY=$(kubectl get secret end2end-management-vault-admin-creds.v1  -o jsonpath='{.data.secretKey}' | base64 -d)
ZENKO_ACCESS_KEY=$(kubectl get secret end2end-account-zenko -o jsonpath='{.data.AccessKeyId}' | base64 -d)
ZENKO_SECRET_KEY=$(kubectl get secret end2end-account-zenko -o jsonpath='{.data.SecretAccessKey}' | base64 -d)
ZENKO_SESSION_TOKEN=$(kubectl get secret end2end-account-zenko -o jsonpath='{.data.SessionToken}' | base64 -d)
OIDC_FULLNAME="${OIDC_FIRST_NAME} ${OIDC_LAST_NAME}"
KEYCLOAK_TEST_USER="${OIDC_USERNAME}-norights"
KEYCLOAK_TEST_PASSWORD=${OIDC_PASSWORD}
KEYCLOAK_TEST_HOST=${OIDC_ENDPOINT}
KEYCLOAK_TEST_PORT="80"
KEYCLOAK_TEST_REALM_NAME=${OIDC_REALM}
KEYCLOAK_TEST_CLIENT_ID=${OIDC_CLIENT_ID}
KEYCLOAK_TEST_GRANT_TYPE="password"

run_e2e_test() {
    kubectl run ${1} ${POD_NAME} \
        --image ${E2E_IMAGE} \
        --restart=Never \
        --rm \
        --attach=True \
        --namespace=${NAMESPACE} \
        --image-pull-policy=Always \
        --env=CLOUDSERVER_HOST=${CLOUDSERVER_HOST} \
        --env=CLOUDSERVER_ENDPOINT=${CLOUDSERVER_ENDPOINT} \
        --env=ZENKO_ACCESS_KEY=${ZENKO_ACCESS_KEY} \
        --env=ZENKO_SECRET_KEY=${ZENKO_SECRET_KEY} \
        --env=ZENKO_SESSION_TOKEN=${ZENKO_SESSION_TOKEN} \
        --env=ADMIN_ACCESS_KEY_ID=${ADMIN_ACCESS_KEY_ID} \
        --env=ADMIN_SECRET_ACCESS_KEY=${ADMIN_SECRET_ACCESS_KEY} \
        --env=VAULT_ENDPOINT=${VAULT_ENDPOINT} \
        --env=VAULT_STS_ENDPOINT=${VAULT_STS_ENDPOINT} \
        --env=TOKEN=${TOKEN} \
        --env=STAGE=${STAGE} \
        --env=CYPRESS_KEYCLOAK_USER_FULLNAME="${OIDC_FULLNAME}" \
        --env=CYPRESS_KEYCLOAK_USERNAME=${OIDC_USERNAME} \
        --env=CYPRESS_KEYCLOAK_PASSWORD=${OIDC_PASSWORD} \
        --env=CYPRESS_KEYCLOAK_ROOT=${OIDC_ENDPOINT} \
        --env=CYPRESS_KEYCLOAK_CLIENT_ID=${OIDC_CLIENT_ID} \
        --env=CYPRESS_KEYCLOAK_REALM=${OIDC_REALM} \
        --env=UI_ENDPOINT=${UI_ENDPOINT} \
        --env=AWS_BACKEND_SOURCE_LOCATION=awsbackend \
        --env=AWS_BACKEND_DESTINATION_LOCATION=awsbackendmismatch \
        --env=GCP_BACKEND_DESTINATION_LOCATION=gcpbackendmismatch \
        --env=AZURE_BACKEND_DESTINATION_LOCATION=azurebackendmismatch \
        --env=LOCATION_QUOTA_BACKEND=quotabackend \
        --env=AWS_BUCKET_NAME=ci-zenko-aws-target-bucket \
        --env=AWS_CRR_BUCKET_NAME=ci-zenko-aws-crr-target-bucket \
        --env=AZURE_CRR_BUCKET_NAME=ci-zenko-azure-crr-target-bucket \
        --env=GCP_CRR_BUCKET_NAME=ci-zenko-gcp-crr-target-bucket \
        --env=GCP_CRR_MPU_BUCKET_NAME=ci-zenko-gcp-crr-mpu-bucket \
        --env=AZURE_ACCOUNT_NAME=devstoreaccount1 \
        --env=AZURE_BACKEND_ENDPOINT=http://azure-mock/devstoreaccount1 \
        --env=AZURE_SECRET_KEY=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw== \
        --env=AWS_ENDPOINT=http://aws-mock.zenko.local \
        --env=AWS_ACCESS_KEY=accessKey1 \
        --env=AWS_SECRET_KEY=verySecretKey1 \
        --env=VERIFY_CERTIFICATES=false \
        --env=RING_S3C_ACCESS_KEY=${RING_S3C_ACCESS_KEY} \
        --env=RING_S3C_SECRET_KEY=${RING_S3C_SECRET_KEY} \
        --env=RING_S3C_ENDPOINT=${RING_S3C_ENDPOINT} \
        --env=RING_S3C_BACKEND_SOURCE_LOCATION=${RING_S3C_BACKEND_SOURCE_LOCATION} \
        --env=RING_S3C_INGESTION_SRC_BUCKET_NAME=${RING_S3C_INGESTION_SRC_BUCKET_NAME} \
        --env=KEYCLOAK_TEST_USER=${KEYCLOAK_TEST_USER} \
        --env=KEYCLOAK_TEST_PASSWORD=${KEYCLOAK_TEST_PASSWORD} \
        --env=KEYCLOAK_TEST_HOST=${KEYCLOAK_TEST_HOST} \
        --env=KEYCLOAK_TEST_PORT=${KEYCLOAK_TEST_PORT} \
        --env=KEYCLOAK_TEST_REALM_NAME=${KEYCLOAK_TEST_REALM_NAME} \
        --env=KEYCLOAK_TEST_CLIENT_ID=${KEYCLOAK_TEST_CLIENT_ID} \
        --env=KEYCLOAK_TEST_GRANT_TYPE=${KEYCLOAK_TEST_GRANT_TYPE} \
        --env=BACKBEAT_BUCKET_CHECK_TIMEOUT_S=180 \
        --command -- sh -c "${2}"
}

## TODO use existing entrypoint
if [ "$STAGE" = "end2end" ]; then
   ## TODO: re-add npm  run test_ui after ZENKO-4033
   run_e2e_test '' 'cd node_tests && npm run test_operator'
elif [ "$STAGE" = "debug" ]; then
   run_e2e_test '-ti' 'bash'
elif [ "$STAGE" = "smoke" ]; then
   run_e2e_test '' 'cd node_tests && npm run test_smoke'
elif [ "$STAGE" = "backbeat" ]; then
   ## TODO: use node js to create and remove buckets
   run_e2e_test '' 'cd node_tests && npm run test_all_extensions && cd .. && python3 cleans3c.py'
elif [ "$STAGE" = "iam-policies" ]; then
   run_e2e_test '' 'cd node_tests && npm run lint && npm run test_iam_policies'
fi
