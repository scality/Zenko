#!/usr/bin/env bash
# setup-e2e-env.sh

# Resolve script dir (works whether sourced or executed)
_SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"

. "$_SETUP_DIR/common.sh"

ZENKO_NAME="${ZENKO_NAME:-end2end}"
NAMESPACE="${NAMESPACE:-default}"

# --- 1. Ingress endpoints + /etc/hosts ---
source "$_SETUP_DIR/configure-e2e-endpoints.sh"

# --- 2. Keycloak / OIDC token ---
export BACKBEAT_BUCKET_CHECK_TIMEOUT_S=${BACKBEAT_BUCKET_CHECK_TIMEOUT_S:-10}
export TOKEN=$(get_token)

# --- 3. Cloudserver config (for MongoDB) ---
CLOUDSERVER_SECRET="$(kubectl get secret \
    -l app.kubernetes.io/name=connector-cloudserver-config,app.kubernetes.io/instance=${ZENKO_NAME} \
    -o jsonpath="{.items[0].data.config\.json}" | base64 -di)"

export MONGO_DATABASE=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.database')
export MONGO_READ_PREFERENCE=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.readPreference')
MONGO_REPLICA_SET_HOSTS_ORIG=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.replicaSetHosts')
export MONGO_SHARD_COLLECTION=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.shardCollections')
export MONGO_WRITE_CONCERN=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.writeConcern')
export MONGO_AUTH_USERNAME=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.authCredentials.username')
export MONGO_AUTH_PASSWORD=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.authCredentials.password')

# --- 4. MongoDB port-forward (reuse existing if alive) ---
MONGO_FQDN=$(echo "${MONGO_REPLICA_SET_HOSTS_ORIG}" | cut -d: -f1)
MONGO_PORT=$(echo "${MONGO_REPLICA_SET_HOSTS_ORIG}" | cut -d: -f2)
MONGO_SVC=$(echo "${MONGO_FQDN}" | cut -d. -f1)
MONGO_NS=$(echo "${MONGO_FQDN}" | cut -d. -f2)

# Only start port-forward if not already listening
if ! ss -tlnp 2>/dev/null | grep -q ":${MONGO_PORT}" && \
   ! lsof -i ":${MONGO_PORT}" &>/dev/null; then
    kubectl port-forward -n "${MONGO_NS}" "svc/${MONGO_SVC}" "${MONGO_PORT}:${MONGO_PORT}" &
    _MONGO_PF_PID=$!
    if [ -z "${_SETUP_E2E_CLEANUP_SET:-}" ]; then
        trap "kill ${_MONGO_PF_PID} 2>/dev/null || true" EXIT
        export _SETUP_E2E_CLEANUP_SET=1
    fi
    # Wait until the port is actually listening (poll every 200ms, fail after 10s)
    timeout 10 bash -c "until ss -tlnp 2>/dev/null | grep -q ':${MONGO_PORT}'; do sleep 0.2; done"
fi
export MONGO_REPLICA_SET_HOSTS="localhost:${MONGO_PORT}"

# --- 5. Credentials from K8s secrets ---
export ADMIN_ACCESS_KEY_ID=$(kubectl get secret ${ZENKO_NAME}-management-vault-admin-creds.v1 -o jsonpath='{.data.accessKey}' | base64 -d)
export ADMIN_SECRET_ACCESS_KEY=$(kubectl get secret ${ZENKO_NAME}-management-vault-admin-creds.v1 -o jsonpath='{.data.secretKey}' | base64 -d)
export ZENKO_ACCESS_KEY=$(kubectl get secret ${ZENKO_NAME}-account-zenko -o jsonpath='{.data.AccessKeyId}' | base64 -d)
export ZENKO_SECRET_KEY=$(kubectl get secret ${ZENKO_NAME}-account-zenko -o jsonpath='{.data.SecretAccessKey}' | base64 -d)
export ZENKO_SESSION_TOKEN=$(kubectl get secret ${ZENKO_NAME}-account-zenko -o jsonpath='{.data.SessionToken}' | base64 -d)

# CRR account credentials
_src_secret="${ZENKO_NAME}-account-${CRR_SOURCE_ACCOUNT_NAME:-crr-source-account}"
_dst_secret="${ZENKO_NAME}-account-${CRR_DESTINATION_ACCOUNT_NAME:-crr-destination-account}"

SOURCE_ACCESS_KEY=$(kubectl get secret "${_src_secret}" -o jsonpath='{.data.AccessKeyId}' | base64 -d)
SOURCE_SECRET_KEY=$(kubectl get secret "${_src_secret}" -o jsonpath='{.data.SecretAccessKey}' | base64 -d)
SOURCE_SESSION_TOKEN=$(kubectl get secret "${_src_secret}" -o jsonpath='{.data.SessionToken}' | base64 -d)
SOURCE_ACCOUNT_ID=$(kubectl get secret "${_src_secret}" -o jsonpath='{.data.AccountId}' | base64 -d)
export CRR_SOURCE_INFO="{\"AccessKeyId\":\"${SOURCE_ACCESS_KEY}\",\"SecretAccessKey\":\"${SOURCE_SECRET_KEY}\",\"SessionToken\":\"${SOURCE_SESSION_TOKEN}\",\"AccountId\":\"${SOURCE_ACCOUNT_ID}\"}"

DESTINATION_ACCESS_KEY=$(kubectl get secret "${_dst_secret}" -o jsonpath='{.data.AccessKeyId}' | base64 -d)
DESTINATION_SECRET_KEY=$(kubectl get secret "${_dst_secret}" -o jsonpath='{.data.SecretAccessKey}' | base64 -d)
DESTINATION_SESSION_TOKEN=$(kubectl get secret "${_dst_secret}" -o jsonpath='{.data.SessionToken}' | base64 -d)
DESTINATION_ACCOUNT_ID=$(kubectl get secret "${_dst_secret}" -o jsonpath='{.data.AccountId}' | base64 -d)
export CRR_DESTINATION_INFO="{\"AccessKeyId\":\"${DESTINATION_ACCESS_KEY}\",\"SecretAccessKey\":\"${DESTINATION_SECRET_KEY}\",\"SessionToken\":\"${DESTINATION_SESSION_TOKEN}\",\"AccountId\":\"${DESTINATION_ACCOUNT_ID}\"}"

# --- 6. Keycloak test user ---
export KEYCLOAK_TEST_USER="${OIDC_USERNAME}-norights"
export KEYCLOAK_TEST_PASSWORD=${OIDC_PASSWORD}
export KEYCLOAK_TEST_HOST=${OIDC_ENDPOINT}
export KEYCLOAK_TEST_PORT="80"
export KEYCLOAK_TEST_REALM_NAME=${OIDC_REALM}
export KEYCLOAK_TEST_CLIENT_ID=${OIDC_CLIENT_ID}
export KEYCLOAK_TEST_GRANT_TYPE="password"

# --- 7. Test backend env vars ---
export AWS_BACKEND_SOURCE_LOCATION AWS_BACKEND_DESTINATION_LOCATION
export AWS_BACKEND_DESTINATION_FAIL_LOCATION
export GCP_BACKEND_DESTINATION_LOCATION
export AZURE_BACKEND_DESTINATION_LOCATION
export COLD_BACKEND_DESTINATION_LOCATION
export AZURE_ARCHIVE_BACKEND_DESTINATION_LOCATION
export MIRIA_BACKEND_DESTINATION_LOCATION
export LOCATION_QUOTA_BACKEND
export AWS_BUCKET_NAME AWS_CRR_BUCKET_NAME AWS_FAIL_BUCKET_NAME
export AZURE_CRR_BUCKET_NAME AZURE_ARCHIVE_BUCKET_NAME
export GCP_CRR_BUCKET_NAME GCP_CRR_MPU_BUCKET_NAME
export GCP_ACCESS_KEY GCP_SECRET_KEY GCP_BACKEND_SERVICE_KEY GCP_BACKEND_SERVICE_EMAIL
export AZURE_ACCOUNT_NAME AZURE_BACKEND_ENDPOINT
export AZURE_SECRET_KEY=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==
export AWS_ENDPOINT
export AWS_ACCESS_KEY=accessKey1
export AWS_SECRET_KEY=verySecretKey1
export VERIFY_CERTIFICATES=false
export ENABLE_RING_TESTS
export RING_S3C_ACCESS_KEY RING_S3C_SECRET_KEY RING_S3C_ENDPOINT
export RING_S3C_BACKEND_SOURCE_LOCATION RING_S3C_INGESTION_SRC_BUCKET_NAME
export RING_S3C_BACKEND_SOURCE_NON_VERSIONED_LOCATION
export RING_S3C_INGESTION_SRC_NON_VERSIONED_BUCKET_NAME
export RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE
export CRR_SOURCE_LOCATION_NAME CRR_DESTINATION_LOCATION_NAME CRR_ROLE_NAME
export MOCHA_FILE=${MOCHA_FILE:-}

# --- 8. TLS CA cert for ingress endpoints ---
ZENKO_CA_CERT_FILE="$(mktemp /tmp/zenko-ca-cert-XXXXXX.pem)"
kubectl get secret zenko-root-ca -o jsonpath='{.data.ca\.crt}' | base64 -d > "${ZENKO_CA_CERT_FILE}"
export NODE_EXTRA_CA_CERTS="${ZENKO_CA_CERT_FILE}"

# --- 9. Override Ring S3C endpoint for out-of-cluster access ---
if kubectl get namespace metadata &>/dev/null; then
    export RING_S3C_ENDPOINT="http://s3c.local"
fi

# --- 10. Install node dependencies ---
NODE_TESTS_DIR="$(cd "$_SETUP_DIR/../../../tests/zenko_tests/node_tests" && pwd)"
cd "$NODE_TESTS_DIR"
yarn install --frozen-lockfile

# --- 11. Persist exports for subsequent CI steps ---
if [ -n "${GITHUB_ENV:-}" ]; then # Don't do it for Codespace
    echo "TOKEN=$TOKEN" >> "$GITHUB_ENV"
    echo "BACKBEAT_BUCKET_CHECK_TIMEOUT_S=$BACKBEAT_BUCKET_CHECK_TIMEOUT_S" >> "$GITHUB_ENV"
    echo "MONGO_DATABASE=$MONGO_DATABASE" >> "$GITHUB_ENV"
    echo "MONGO_READ_PREFERENCE=$MONGO_READ_PREFERENCE" >> "$GITHUB_ENV"
    echo "MONGO_REPLICA_SET_HOSTS=$MONGO_REPLICA_SET_HOSTS" >> "$GITHUB_ENV"
    echo "MONGO_SHARD_COLLECTION=$MONGO_SHARD_COLLECTION" >> "$GITHUB_ENV"
    echo "MONGO_WRITE_CONCERN=$MONGO_WRITE_CONCERN" >> "$GITHUB_ENV"
    echo "MONGO_AUTH_USERNAME=$MONGO_AUTH_USERNAME" >> "$GITHUB_ENV"
    echo "MONGO_AUTH_PASSWORD=$MONGO_AUTH_PASSWORD" >> "$GITHUB_ENV"
    echo "ADMIN_ACCESS_KEY_ID=$ADMIN_ACCESS_KEY_ID" >> "$GITHUB_ENV"
    echo "ADMIN_SECRET_ACCESS_KEY=$ADMIN_SECRET_ACCESS_KEY" >> "$GITHUB_ENV"
    echo "ZENKO_ACCESS_KEY=$ZENKO_ACCESS_KEY" >> "$GITHUB_ENV"
    echo "ZENKO_SECRET_KEY=$ZENKO_SECRET_KEY" >> "$GITHUB_ENV"
    echo "ZENKO_SESSION_TOKEN=$ZENKO_SESSION_TOKEN" >> "$GITHUB_ENV"
    echo "KEYCLOAK_TEST_USER=$KEYCLOAK_TEST_USER" >> "$GITHUB_ENV"
    echo "KEYCLOAK_TEST_PASSWORD=$KEYCLOAK_TEST_PASSWORD" >> "$GITHUB_ENV"
    echo "KEYCLOAK_TEST_HOST=$KEYCLOAK_TEST_HOST" >> "$GITHUB_ENV"
    echo "KEYCLOAK_TEST_PORT=$KEYCLOAK_TEST_PORT" >> "$GITHUB_ENV"
    echo "KEYCLOAK_TEST_REALM_NAME=$KEYCLOAK_TEST_REALM_NAME" >> "$GITHUB_ENV"
    echo "KEYCLOAK_TEST_CLIENT_ID=$KEYCLOAK_TEST_CLIENT_ID" >> "$GITHUB_ENV"
    echo "KEYCLOAK_TEST_GRANT_TYPE=$KEYCLOAK_TEST_GRANT_TYPE" >> "$GITHUB_ENV"
    echo "CLOUDSERVER_HOST=$CLOUDSERVER_HOST" >> "$GITHUB_ENV"
    echo "CLOUDSERVER_ENDPOINT=$CLOUDSERVER_ENDPOINT" >> "$GITHUB_ENV"
    echo "BACKBEAT_API_ENDPOINT=$BACKBEAT_API_ENDPOINT" >> "$GITHUB_ENV"
    echo "VAULT_ENDPOINT=$VAULT_ENDPOINT" >> "$GITHUB_ENV"
    echo "VAULT_STS_ENDPOINT=$VAULT_STS_ENDPOINT" >> "$GITHUB_ENV"
    echo "VAULT_AUTH_HOST=$VAULT_AUTH_HOST" >> "$GITHUB_ENV"
    echo "NODE_EXTRA_CA_CERTS=$NODE_EXTRA_CA_CERTS" >> "$GITHUB_ENV"
    echo "MOCHA_FILE=$MOCHA_FILE" >> "$GITHUB_ENV"
    echo "VERIFY_CERTIFICATES=$VERIFY_CERTIFICATES" >> "$GITHUB_ENV"
    echo "ENABLE_RING_TESTS=$ENABLE_RING_TESTS" >> "$GITHUB_ENV"
    echo "AWS_ACCESS_KEY=$AWS_ACCESS_KEY" >> "$GITHUB_ENV"
    echo "AWS_SECRET_KEY=$AWS_SECRET_KEY" >> "$GITHUB_ENV"
    echo "AWS_ENDPOINT=$AWS_ENDPOINT" >> "$GITHUB_ENV"
    echo "AWS_FAIL_BUCKET_NAME=$AWS_FAIL_BUCKET_NAME" >> "$GITHUB_ENV"
    echo "AZURE_ACCOUNT_NAME=$AZURE_ACCOUNT_NAME" >> "$GITHUB_ENV"
    echo "AZURE_BACKEND_ENDPOINT=$AZURE_BACKEND_ENDPOINT" >> "$GITHUB_ENV"
    echo "AZURE_SECRET_KEY=$AZURE_SECRET_KEY" >> "$GITHUB_ENV"
    echo "AZURE_CRR_BUCKET_NAME=$AZURE_CRR_BUCKET_NAME" >> "$GITHUB_ENV"
    echo "AZURE_ARCHIVE_BUCKET_NAME=$AZURE_ARCHIVE_BUCKET_NAME" >> "$GITHUB_ENV"
    echo "RING_S3C_ACCESS_KEY=$RING_S3C_ACCESS_KEY" >> "$GITHUB_ENV"
    echo "RING_S3C_SECRET_KEY=$RING_S3C_SECRET_KEY" >> "$GITHUB_ENV"
    echo "RING_S3C_ENDPOINT=$RING_S3C_ENDPOINT" >> "$GITHUB_ENV"
    echo "CRR_SOURCE_LOCATION_NAME=$CRR_SOURCE_LOCATION_NAME" >> "$GITHUB_ENV"
    echo "CRR_DESTINATION_LOCATION_NAME=$CRR_DESTINATION_LOCATION_NAME" >> "$GITHUB_ENV"
    echo "CRR_ROLE_NAME=$CRR_ROLE_NAME" >> "$GITHUB_ENV"
    # JSON vars need the heredoc delimiter syntax (values contain '=')
    printf 'CRR_SOURCE_INFO<<EOF\n%s\nEOF\n' "$CRR_SOURCE_INFO" >> "$GITHUB_ENV"
    printf 'CRR_DESTINATION_INFO<<EOF\n%s\nEOF\n' "$CRR_DESTINATION_INFO" >> "$GITHUB_ENV"
fi