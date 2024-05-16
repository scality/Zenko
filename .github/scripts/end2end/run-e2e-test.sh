#!/usr/bin/env bash

set -exu

DIR=$(dirname $0)

. "$DIR/common.sh"

ZENKO_NAME=${1:-end2end}
E2E_IMAGE=${2:-ghcr.io/scality/zenko/zenko-e2e:latest}
STAGE=${3:-end2end}
NAMESPACE=${4:-default}

BACKBEAT_BUCKET_CHECK_TIMEOUT_S=${BACKBEAT_BUCKET_CHECK_TIMEOUT_S:-10}

POD_NAME="${ZENKO_NAME}-${STAGE//_/-}-test"
TOKEN=$(get_token)

CLOUDSERVER_SECRET="$(kubectl get secret -l app.kubernetes.io/name=connector-cloudserver-config,app.kubernetes.io/instance=end2end \
   -o jsonpath="{.items[0].data.config\.json}" | base64 -di)"

# set environment vars
MONGO_DATABASE=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.database')
MONGO_READ_PREFERENCE=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.readPreference')
MONGO_REPLICA_SET_HOSTS=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.replicaSetHosts')
MONGO_SHARD_COLLECTION=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.shardCollections')
MONGO_WRITE_CONCERN=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.writeConcern')
MONGO_AUTH_USERNAME=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.authCredentials.username')
MONGO_AUTH_PASSWORD=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.authCredentials.password')
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
MOCHA_FILE=${MOCHA_FILE:-}

run_e2e_test() {
    kubectl run ${1} ${POD_NAME} \
        --pod-running-timeout=5m \
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
        --env=AWS_BACKEND_SOURCE_LOCATION=${AWS_BACKEND_SOURCE_LOCATION} \
        --env=AWS_BACKEND_DESTINATION_LOCATION=${AWS_BACKEND_DESTINATION_LOCATION} \
        --env=AWS_S3_FAIL_BACKEND_DESTINATION_LOCATION=${AWS_BACKEND_DESTINATION_FAIL_LOCATION} \
        --env=GCP_BACKEND_DESTINATION_LOCATION=${GCP_BACKEND_DESTINATION_LOCATION} \
        --env=AZURE_BACKEND_DESTINATION_LOCATION=${AZURE_BACKEND_DESTINATION_LOCATION} \
        --env=COLD_BACKEND_DESTINATION_LOCATION=${COLD_BACKEND_DESTINATION_LOCATION} \
        --env=AZURE_ARCHIVE_BACKEND_DESTINATION_LOCATION=${AZURE_ARCHIVE_BACKEND_DESTINATION_LOCATION} \
        --env=LOCATION_QUOTA_BACKEND=${LOCATION_QUOTA_BACKEND} \
        --env=AWS_BUCKET_NAME=${AWS_BUCKET_NAME} \
        --env=AWS_CRR_BUCKET_NAME=${AWS_CRR_BUCKET_NAME} \
        --env=AWS_S3_FAIL_BACKBEAT_BUCKET_NAME=${AWS_FAIL_BUCKET_NAME} \
        --env=AZURE_CRR_BUCKET_NAME=${AZURE_CRR_BUCKET_NAME} \
        --env=AZURE_ARCHIVE_BUCKET_NAME=${AZURE_ARCHIVE_BUCKET_NAME} \
        --env=GCP_CRR_BUCKET_NAME=${GCP_CRR_BUCKET_NAME} \
        --env=GCP_CRR_MPU_BUCKET_NAME=${GCP_CRR_MPU_BUCKET_NAME} \
        --env=GCP_ACCESS_KEY=${GCP_ACCESS_KEY} \
        --env=GCP_SECRET_KEY=${GCP_SECRET_KEY} \
        --env=GCP_BACKEND_SERVICE_KEY="${GCP_BACKEND_SERVICE_KEY}" \
        --env=GCP_BACKEND_SERVICE_EMAIL=${GCP_BACKEND_SERVICE_EMAIL} \
        --env=AZURE_ACCOUNT_NAME=${AZURE_ACCOUNT_NAME} \
        --env=AZURE_BACKEND_ENDPOINT=${AZURE_BACKEND_ENDPOINT} \
        --env=AZURE_SECRET_KEY=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw== \
        --env=AWS_ENDPOINT=${AWS_ENDPOINT} \
        --env=AWS_ACCESS_KEY=accessKey1 \
        --env=AWS_SECRET_KEY=verySecretKey1 \
        --env=VERIFY_CERTIFICATES=false \
        --env=ENABLE_RING_TESTS=${ENABLE_RING_TESTS} \
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
        --env=BACKBEAT_BUCKET_CHECK_TIMEOUT_S=${BACKBEAT_BUCKET_CHECK_TIMEOUT_S} \
        --env=MONGO_DATABASE=${MONGO_DATABASE} \
        --env=MONGO_READ_PREFERENCE=${MONGO_READ_PREFERENCE} \
        --env=MONGO_REPLICA_SET_HOSTS=${MONGO_REPLICA_SET_HOSTS} \
        --env=MONGO_SHARD_COLLECTION=${MONGO_SHARD_COLLECTION} \
        --env=MONGO_WRITE_CONCERN=${MONGO_WRITE_CONCERN} \
        --env=MONGO_AUTH_USERNAME=${MONGO_AUTH_USERNAME} \
        --env=MONGO_AUTH_PASSWORD=${MONGO_AUTH_PASSWORD} \
        --env=MOCHA_FILE=${MOCHA_FILE} \
        --override-type strategic \
        --overrides='
{
  "apiVersion": "v1",
  "kind": "Pod",
  "spec": {
    "containers": [
      {
        "name": "'$POD_NAME'",
        "volumeMounts": [
          {
            "name": "reports",
            "mountPath": "/reports"
          }
        ]
      }
    ],
    "volumes": [
      {
        "name": "reports",
        "hostPath": {
          "path": "/data/reports",
          "type": "DirectoryOrCreate"
        }
      }
    ]
  }
}' -- sh -c "${2}"

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
   run_e2e_test '' 'cd node_tests && ./gcp_shim.sh && npm run test_all_extensions && cd .. && python3 cleans3c.py'
elif [ "$STAGE" = "iam-policies" ]; then
   run_e2e_test '' 'cd node_tests && npm run test_iam_policies'
elif [ "$STAGE" = "object-api" ]; then
   run_e2e_test '' 'cd node_tests && npm run test_object_api'
elif [ "$STAGE" = "lint" ]; then
   run_e2e_test '' 'cd node_tests && npm run lint'
fi
