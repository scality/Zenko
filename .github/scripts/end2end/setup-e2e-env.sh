#!/usr/bin/env bash
# setup-e2e-env.sh
# Keep this file idempotent

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
    kubectl port-forward -n "${MONGO_NS}" "svc/${MONGO_SVC}" "${MONGO_PORT}:${MONGO_PORT}" &>/dev/null &
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
export KEYCLOAK_REALM=${OIDC_REALM} # cli-testing KeycloakSetup hook reads KEYCLOAK_REALM from env
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
export MOCHA_FILE=${MOCHA_FILE:-_reports/test-results-[hash].xml}

# Ensure test results dir exists for Mocha JUnit reporter
mkdir -p "$(dirname "$MOCHA_FILE")"

# --- 8. TLS CA cert for ingress endpoints ---
ZENKO_CA_CERT_FILE="$(mktemp /tmp/zenko-ca-cert-XXXXXX.pem)"
kubectl get secret zenko-root-ca -o jsonpath='{.data.ca\.crt}' | base64 -d > "${ZENKO_CA_CERT_FILE}"
export NODE_EXTRA_CA_CERTS="${ZENKO_CA_CERT_FILE}"

# --- 9. Override Ring S3C endpoint for out-of-cluster access ---
if kubectl get namespace metadata &>/dev/null; then
    export RING_S3C_ENDPOINT="http://s3c.local"
fi

# =====================================================================
# --- 10. CTST-specific setup (Kafka, service users, Zenko CR data) ---
# =====================================================================
# This block is skipped when SKIP_CTST=1 (e.g., mocha-only jobs).
# CTST setup runs by default; non-CTST callers must set SKIP_CTST=1.

ZENKO_ROOT="$(cd "$_SETUP_DIR/../../.." && pwd)"
export TARGET_VERSION=$(sed -n 's/^VERSION="\([^"]*\)"/\1/p' "${ZENKO_ROOT}/VERSION")

if [ "${SKIP_CTST:-}" = "1" ]; then
    echo "SKIP_CTST=1 set, skipping CTST-specific setup"
else
    # CTST account & user names
    export ZENKO_ACCOUNT_NAME="zenko-ctst"
    export STORAGE_MANAGER_USER_NAME="storage_manager"
    export STORAGE_ACCOUNT_OWNER_USER_NAME="storage_account_owner"
    export DATA_CONSUMER_USER_NAME="data_consumer"
    export DATA_ACCESSOR_USER_NAME="data_accessor"
    # env vars used by cli-testing's Keycloak.ts seeder
    export ACCOUNT="${ZENKO_ACCOUNT_NAME}"
    export STORAGE_MANAGER="${STORAGE_MANAGER_USER_NAME}"
    export STORAGE_ACCOUNT_OWNER="${STORAGE_ACCOUNT_OWNER_USER_NAME}"
    export DATA_CONSUMER="${DATA_CONSUMER_USER_NAME}"
    export DATA_ACCESSOR="${DATA_ACCESSOR_USER_NAME}"
    export SEED_KEYCLOAK_DEFAULT_ROLES=true
    export ZENKO_PORT="80"

    # PRA admin credentials (may not exist for non-PRA runs; ignore errors)
    export ADMIN_PRA_ACCESS_KEY_ID=$(kubectl get secret ${ZENKO_NAME}-pra-management-vault-admin-creds.v1 -o jsonpath='{.data.accessKey}' 2>/dev/null | base64 -d 2>/dev/null || echo "")
    export ADMIN_PRA_SECRET_ACCESS_KEY=$(kubectl get secret ${ZENKO_NAME}-pra-management-vault-admin-creds.v1 -o jsonpath='{.data.secretKey}' 2>/dev/null | base64 -d 2>/dev/null || echo "")

    # --- 11. Service user credentials ---
    BACKBEAT_LCBP_1_CREDS=$(kubectl get secret -l app.kubernetes.io/name=backbeat-lcbp-user-creds,app.kubernetes.io/instance=${ZENKO_NAME} -o jsonpath='{.items[0].data.backbeat-lifecycle-bp-1\.json}' | base64 -d)
    BACKBEAT_LCC_1_CREDS=$(kubectl get secret -l app.kubernetes.io/name=backbeat-lcc-user-creds,app.kubernetes.io/instance=${ZENKO_NAME} -o jsonpath='{.items[0].data.backbeat-lifecycle-conductor-1\.json}' | base64 -d)
    BACKBEAT_LCOP_1_CREDS=$(kubectl get secret -l app.kubernetes.io/name=backbeat-lcop-user-creds,app.kubernetes.io/instance=${ZENKO_NAME} -o jsonpath='{.items[0].data.backbeat-lifecycle-op-1\.json}' | base64 -d)
    BACKBEAT_QP_1_CREDS=$(kubectl get secret -l app.kubernetes.io/name=backbeat-qp-user-creds,app.kubernetes.io/instance=${ZENKO_NAME} -o jsonpath='{.items[0].data.backbeat-qp-1\.json}' | base64 -d)
    SORBET_FWD_2_ACCESSKEY=$(kubectl get secret -l app.kubernetes.io/name=sorbet-fwd-creds,app.kubernetes.io/instance=${ZENKO_NAME} -o jsonpath='{.items[0].data.accessKey}' | base64 -d)
    SORBET_FWD_2_SECRETKEY=$(kubectl get secret -l app.kubernetes.io/name=sorbet-fwd-creds,app.kubernetes.io/instance=${ZENKO_NAME} -o jsonpath='{.items[0].data.secretKey}' | base64 -d)
    export SERVICE_USERS_CREDENTIALS=$(echo '{"backbeat-lifecycle-bp-1":'"${BACKBEAT_LCBP_1_CREDS}"',"backbeat-lifecycle-conductor-1":'"${BACKBEAT_LCC_1_CREDS}"',"backbeat-lifecycle-op-1":'"${BACKBEAT_LCOP_1_CREDS}"',"backbeat-qp-1":'"${BACKBEAT_QP_1_CREDS}"',"sorbet-fwd-2":{"accessKey":"'"${SORBET_FWD_2_ACCESSKEY}"'","secretKey":"'"${SORBET_FWD_2_SECRETKEY}"'"}}' | jq -R)

    # --- 12. Kafka topics for sorbet ---
    SORBET_CONFIG=$(kubectl get secret -l app.kubernetes.io/name=cold-sorbet-config-e2e-azure-archive,app.kubernetes.io/instance=${ZENKO_NAME} \
        -o jsonpath='{.items[0].data.config\.json}' | base64 -di)
    export KAFKA_DEAD_LETTER_TOPIC=$(echo "${SORBET_CONFIG}" | jq -r '."kafka-dead-letter-topic"')
    export KAFKA_OBJECT_TASK_TOPIC=$(echo "${SORBET_CONFIG}" | jq -r '."kafka-object-task-topic"')
    export KAFKA_GC_REQUEST_TOPIC=$(echo "${SORBET_CONFIG}" | jq -r '."kafka-gc-request-topic"')

    # --- 13. Kafka host from backbeat config + port-forward ---
    KAFKA_HOST_PORT_ORIG=$(kubectl get secret -l app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=${ZENKO_NAME} \
        -o jsonpath='{.items[0].data.config\.json}' | base64 -di | jq -r .kafka.hosts)
    KAFKA_SVC=${KAFKA_HOST_PORT_ORIG%:*}
    KAFKA_PORT=${KAFKA_HOST_PORT_ORIG#*:}

    # Port-forward for Kafka broker (TCP — no ingress possible)
    if ! ss -tlnp 2>/dev/null | grep -q ":${KAFKA_PORT}" && \
       ! lsof -i ":${KAFKA_PORT}" &>/dev/null; then
        kubectl port-forward "svc/${KAFKA_SVC}" "${KAFKA_PORT}:${KAFKA_PORT}" &>/dev/null &
        _KAFKA_PF_PID=$!
        timeout 10 bash -c "until ss -tlnp 2>/dev/null | grep -q ':${KAFKA_PORT}'; do sleep 0.2; done"
    fi
    export KAFKA_HOST_PORT="localhost:${KAFKA_PORT}"

    # Kafka broker advertises its internal FQDN in metadata responses (e.g. end2end-base-queue-0.default.svc.cluster.local).
    # Add both short and FQDN to /etc/hosts so clients can resolve them via the localhost port-forward.
    KAFKA_FQDN="${KAFKA_SVC}.${NAMESPACE}.svc.cluster.local"
    if ! grep -qw "${KAFKA_FQDN}" /etc/hosts 2>/dev/null; then
        echo "127.0.0.1 ${KAFKA_SVC} ${KAFKA_FQDN}" | sudo tee -a /etc/hosts
    fi

    # Kafka auth broker — for bucket notification tests with SASL (PLAIN + SCRAM).
    #
    # The auth broker is a separate Kafka cluster (end2end-base-queue-auth).
    # Like the main broker it advertises its internal FQDN in metadata responses,
    # e.g. "end2end-base-queue-auth-0.default.svc.cluster.local:9092".
    # After the initial connection the Kafka client reconnects to the advertised
    # address, so the /etc/hosts entry MUST resolve to the IP that reaches *this*
    # broker's port-forward — NOT the main broker's.
    #
    # We use the loopback alias 127.0.0.2 for the auth broker so that:
    #   - 127.0.0.1:9092  →  main broker  (end2end-base-queue-0)
    #   - 127.0.0.2:9092  →  auth broker  (end2end-base-queue-auth-0)
    # and the advertised FQDN resolves to 127.0.0.2, keeping the metadata
    # redirect on the correct port-forward.
    KAFKA_AUTH_HOST="${ZENKO_NAME}-base-queue-auth-0"
    KAFKA_AUTH_LOOPBACK="127.0.0.2"
    KAFKA_AUTH_PORT=${KAFKA_PORT}
    if ! ss -tlnp 2>/dev/null | grep -q "${KAFKA_AUTH_LOOPBACK}:${KAFKA_AUTH_PORT}" && \
       ! lsof -i "@${KAFKA_AUTH_LOOPBACK}:${KAFKA_AUTH_PORT}" &>/dev/null; then
        echo "Waiting for auth Kafka cluster to be running..."
        kubectl wait --for=jsonpath='{.status.state}'=ClusterRunning --timeout=5m \
            kafkacluster "${ZENKO_NAME}-base-queue-auth"
        # Port-forward on the dedicated loopback so metadata redirects stay correct
        kubectl port-forward --address "${KAFKA_AUTH_LOOPBACK}" \
            "svc/${KAFKA_AUTH_HOST}" "${KAFKA_AUTH_PORT}:${KAFKA_AUTH_PORT}" &>/dev/null &
        _KAFKA_AUTH_PF_PID=$!
        timeout 10 bash -c "until ss -tlnp 2>/dev/null | grep -q '${KAFKA_AUTH_LOOPBACK}:${KAFKA_AUTH_PORT}'; do sleep 0.2; done"
    fi
    export KAFKA_AUTH_HOST_PORT="${KAFKA_AUTH_LOOPBACK}:${KAFKA_AUTH_PORT}"

    # Point the auth broker's advertised hostname to the dedicated loopback
    KAFKA_AUTH_FQDN="${KAFKA_AUTH_HOST}.${NAMESPACE}.svc.cluster.local"
    if ! grep -qw "${KAFKA_AUTH_FQDN}" /etc/hosts 2>/dev/null; then
        echo "${KAFKA_AUTH_LOOPBACK} ${KAFKA_AUTH_HOST} ${KAFKA_AUTH_FQDN}" | sudo tee -a /etc/hosts
    fi

    # Prometheus — port-forward for CTST PRA tests
    PROMETHEUS_SVC="${PROMETHEUS_NAME:-prometheus}-operated"
    PROMETHEUS_PORT=9090
    if ! ss -tlnp 2>/dev/null | grep -q ":${PROMETHEUS_PORT}" && \
       ! lsof -i ":${PROMETHEUS_PORT}" &>/dev/null; then
        kubectl port-forward "svc/${PROMETHEUS_SVC}" "${PROMETHEUS_PORT}:${PROMETHEUS_PORT}" &>/dev/null &
        _PROM_PF_PID=$!
        timeout 10 bash -c "until ss -tlnp 2>/dev/null | grep -q ':${PROMETHEUS_PORT}'; do sleep 0.2; done"
    fi
    export PROMETHEUS_SERVICE="${PROMETHEUS_SVC}.${NAMESPACE}.svc.cluster.local"

    # --- 14. Zenko CR metadata ---
    export TIME_PROGRESSION_FACTOR=$(kubectl get zenko ${ZENKO_NAME} -o jsonpath="{.metadata.annotations.zenko\.io/time-progression-factor}")
    export INSTANCE_ID=$(kubectl get zenko ${ZENKO_NAME} -o jsonpath='{.status.instanceID}')
    export KAFKA_CLEANER_INTERVAL=$(kubectl get zenko ${ZENKO_NAME} -o jsonpath='{.spec.kafkaCleaner.interval}')
    export SORBETD_RESTORE_TIMEOUT=$(kubectl get zenko ${ZENKO_NAME} -o jsonpath='{.spec.sorbet.server.azure.restoreTimeout}')

    # Backbeat API (use ingress — already exported as BACKBEAT_API_ENDPOINT)
    export BACKBEAT_API_HOST="backbeat-api.zenko.local"
    export BACKBEAT_API_PORT="80"

    # Utilization service
    export UTILIZATION_SERVICE_HOST=$(kubectl get zenko ${ZENKO_NAME} -o jsonpath='{.spec.scuba.api.ingress.hostname}')
    export UTILIZATION_SERVICE_PORT="80"

    # Azure archive settings
    export AZURE_ARCHIVE_ACCESS_TIER="Hot"
    export AZURE_ARCHIVE_MANIFEST_ACCESS_TIER="Hot"
    export AZURE_BLOB_URL="${AZURE_BACKEND_ENDPOINT}"
    export AZURE_QUEUE_URL="${AZURE_BACKEND_QUEUE_ENDPOINT}"

    # --- 15. Grant Kube API access (needed by CTST for CronJob/Pod operations) ---
    kubectl create clusterrolebinding serviceaccounts-cluster-admin \
        --clusterrole=cluster-admin \
        --group=system:serviceaccounts 2>/dev/null || true

    # --- 15b. Install sorbet & drctl binaries for CTST ---
    CTST_DIR="$(cd "${ZENKO_ROOT}/tests/ctst" && pwd)"
    SORBET_IMAGE=$(yq eval '.sorbet | .sourceRegistry + "/" + .image' "${ZENKO_ROOT}/solution/deps.yaml")
    SORBET_TAG=$(yq eval '.sorbet.tag' "${ZENKO_ROOT}/solution/deps.yaml")
    DRCTL_IMAGE=$(yq eval '.drctl | .sourceRegistry + "/" + .image' "${ZENKO_ROOT}/solution/deps.yaml")
    DRCTL_TAG=$(yq eval '.drctl.tag' "${ZENKO_ROOT}/solution/deps.yaml")

    if [ ! -f "${CTST_DIR}/sorbetctl" ]; then
        _cid=$(docker create "${SORBET_IMAGE}:${SORBET_TAG}" true)
        docker cp "${_cid}:/sorbetctl" "${CTST_DIR}/sorbetctl"
        docker rm "${_cid}" >/dev/null
        chmod +x "${CTST_DIR}/sorbetctl"
    fi
    if [ ! -f "${CTST_DIR}/zenko-drctl" ]; then
        _cid=$(docker create "${DRCTL_IMAGE}:${DRCTL_TAG}" true)
        docker cp "${_cid}:/zenko-drctl" "${CTST_DIR}/zenko-drctl"
        docker rm "${_cid}" >/dev/null
        chmod +x "${CTST_DIR}/zenko-drctl"
    fi

    # --- 16. Build CTST world parameters JSON ---
    export CTST_WORLD_PARAMETERS="$(jq -c <<EOF
    {
      "subdomain":"${SUBDOMAIN}",
      "DRSubdomain":"${DR_SUBDOMAIN:-}",
      "ssl":false,
      "port":"${ZENKO_PORT}",
      "AccountName":"${ZENKO_ACCOUNT_NAME}",
      "AdminAccessKey":"${ADMIN_ACCESS_KEY_ID}",
      "AdminSecretKey":"${ADMIN_SECRET_ACCESS_KEY}",
      "VaultAuthHost":"${VAULT_AUTH_HOST}",
      "NotificationDestination":"${NOTIF_DEST_NAME}",
      "NotificationDestinationTopic":"${NOTIF_DEST_TOPIC}",
      "NotificationDestinationAlt":"${NOTIF_ALT_DEST_NAME}",
      "NotificationDestinationTopicAlt":"${NOTIF_ALT_DEST_TOPIC}",
      "NotificationDestinationPlain":"${NOTIF_PLAIN_DEST_NAME}",
      "NotificationDestinationTopicPlain":"${NOTIF_AUTH_DEST_TOPIC}",
      "NotificationDestinationScram":"${NOTIF_SCRAM_DEST_NAME}",
      "NotificationDestinationTopicScram":"${NOTIF_SCRAM_DEST_TOPIC}",
      "KafkaExternalIps": "${KAFKA_EXTERNAL_IP:-}",
      "PrometheusService":"${PROMETHEUS_SERVICE}",
      "PrometheusEndpoint":"http://localhost:${PROMETHEUS_PORT}",
      "KafkaHosts":"${KAFKA_HOST_PORT}",
      "KafkaAuthHosts":"${KAFKA_AUTH_HOST_PORT}",
      "KafkaConnectUrl":"${KAFKA_CONNECT_URL}",
      "KeycloakUsername":"${OIDC_USERNAME}",
      "KeycloakPassword":"${OIDC_PASSWORD}",
      "KeycloakTestPassword":"${KEYCLOAK_TEST_PASSWORD}",
      "KeycloakHost":"${OIDC_HOST}",
      "KeycloakPort":"${KEYCLOAK_TEST_PORT}",
      "KeycloakRealm":"${KEYCLOAK_TEST_REALM_NAME}",
      "KeycloakClientId":"${KEYCLOAK_TEST_CLIENT_ID}",
      "KeycloakGrantType":"${KEYCLOAK_TEST_GRANT_TYPE}",
      "StorageManagerUsername":"${STORAGE_MANAGER_USER_NAME}",
      "StorageAccountOwnerUsername":"${STORAGE_ACCOUNT_OWNER_USER_NAME}",
      "DataConsumerUsername":"${DATA_CONSUMER_USER_NAME}",
      "DataAccessorUsername":"${DATA_ACCESSOR_USER_NAME}",
      "ServiceUsersCredentials":${SERVICE_USERS_CREDENTIALS},
      "AzureAccountName":"${AZURE_ACCOUNT_NAME}",
      "AzureAccountKey":"${AZURE_SECRET_KEY}",
      "AzureArchiveContainer":"${AZURE_ARCHIVE_BUCKET_NAME}",
      "AzureArchiveContainer2":"${AZURE_ARCHIVE_BUCKET_NAME_2:-}",
      "AzureArchiveAccessTier":"${AZURE_ARCHIVE_ACCESS_TIER}",
      "AzureArchiveManifestTier":"${AZURE_ARCHIVE_MANIFEST_ACCESS_TIER}",
      "AzureArchiveQueue":"${AZURE_ARCHIVE_QUEUE_NAME:-}",
      "TimeProgressionFactor":"${TIME_PROGRESSION_FACTOR}",
      "KafkaObjectTaskTopic":"${KAFKA_OBJECT_TASK_TOPIC}",
      "KafkaGCRequestTopic":"${KAFKA_GC_REQUEST_TOPIC}",
      "KafkaDeadLetterQueueTopic":"${KAFKA_DEAD_LETTER_TOPIC}",
      "InstanceID":"${INSTANCE_ID}",
      "BackbeatApiHost":"${BACKBEAT_API_HOST}",
      "BackbeatApiPort":"${BACKBEAT_API_PORT}",
      "KafkaCleanerInterval":"${KAFKA_CLEANER_INTERVAL}",
      "SorbetdRestoreTimeout":"${SORBETD_RESTORE_TIMEOUT}",
      "DRAdminAccessKey":"${ADMIN_PRA_ACCESS_KEY_ID}",
      "DRAdminSecretKey":"${ADMIN_PRA_SECRET_ACCESS_KEY}",
      "UtilizationServiceHost":"${UTILIZATION_SERVICE_HOST}",
      "UtilizationServicePort":"${UTILIZATION_SERVICE_PORT}",
      "KubeconfigPath":"${KUBECONFIG:-${HOME}/.kube/config}"
    }
EOF
    )"

fi # SKIP_CTST

# --- 17. Install node dependencies ---
NODE_TESTS_DIR="$(cd "${ZENKO_ROOT}/tests/zenko_tests/node_tests" && pwd)"
cd "$NODE_TESTS_DIR"
yarn install --frozen-lockfile

# --- 18. Persist exports for subsequent CI steps ---
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
    echo "KEYCLOAK_REALM=$KEYCLOAK_REALM" >> "$GITHUB_ENV"
    echo "KEYCLOAK_TEST_CLIENT_ID=$KEYCLOAK_TEST_CLIENT_ID" >> "$GITHUB_ENV"
    echo "KEYCLOAK_TEST_GRANT_TYPE=$KEYCLOAK_TEST_GRANT_TYPE" >> "$GITHUB_ENV"
    echo "CLOUDSERVER_HOST=$CLOUDSERVER_HOST" >> "$GITHUB_ENV"
    echo "CLOUDSERVER_ENDPOINT=$CLOUDSERVER_ENDPOINT" >> "$GITHUB_ENV"
    echo "BACKBEAT_API_ENDPOINT=$BACKBEAT_API_ENDPOINT" >> "$GITHUB_ENV"
    echo "VAULT_ENDPOINT=$VAULT_ENDPOINT" >> "$GITHUB_ENV"
    echo "VAULT_STS_ENDPOINT=$VAULT_STS_ENDPOINT" >> "$GITHUB_ENV"
    echo "VAULT_AUTH_HOST=$VAULT_AUTH_HOST" >> "$GITHUB_ENV"
    echo "KAFKA_CONNECT_URL=$KAFKA_CONNECT_URL" >> "$GITHUB_ENV"
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