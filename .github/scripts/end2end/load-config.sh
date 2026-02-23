#!/bin/bash
# Unified configuration loader for Zenko end-to-end tests
#
# Usage:
#   source load-config.sh ctst     # Load config for CTST tests
#   source load-config.sh e2e      # Load config for zenko_tests (e2e)
#   source load-config.sh common   # Load only common config
#
# After sourcing, use the helpers:
#   kubectl exec pod -- env $(env_for_kubectl_exec) command
#   kubectl run pod $(env_for_kubectl_run) -- command

set -e +x

SUITE="${1:-common}"


# Extract a value from the top-level env block in end2end.yaml.
# Strips ${{ ... }} expressions (secrets/context refs) leaving an empty string.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOWS_END2END_YAML="${SCRIPT_DIR}/../../workflows/end2end.yaml"
get_env_var() {
    local key="$1"
    yq eval ".env.${key}" "$WORKFLOWS_END2END_YAML" | sed 's/\${{[^}]*}}//g' | tr -d '"'
}

# Output helpers – both derived from the same ENV_VARS array.
# Usage: kubectl exec pod -- env $(env_for_kubectl_exec) command
env_for_kubectl_exec() { printf '%s ' "${ENV_VARS[@]}"; }
# Usage: kubectl run pod $(env_for_kubectl_run) -- command
env_for_kubectl_run()  { printf -- '--env=%s ' "${ENV_VARS[@]}"; }

# =============================================================================
# COMMON - Used by both CTST and zenko_tests
# =============================================================================
load_common() {
    ENV_VARS=()

    # From end2end.yaml
    ENV_VARS+=("KEYCLOAK_TEST_REALM_NAME=$(get_env_var KEYCLOAK_TEST_REALM_NAME)")
    ENV_VARS+=("KEYCLOAK_TEST_CLIENT_ID=$(get_env_var KEYCLOAK_TEST_CLIENT_ID)")
    if [[ "$SUITE" == "e2e" ]]; then
        ENV_VARS+=("KEYCLOAK_TEST_USER=$(get_env_var KEYCLOAK_TEST_USER)-norights")
    elif [[ "$SUITE" == "ctst" ]]; then
        ENV_VARS+=("KEYCLOAK_TEST_USER=$(get_env_var KEYCLOAK_TEST_USER)")
    fi
    ENV_VARS+=("KEYCLOAK_TEST_PASSWORD=$(get_env_var KEYCLOAK_TEST_PASSWORD)")
    ENV_VARS+=("KEYCLOAK_TEST_HOST=$(get_env_var KEYCLOAK_TEST_HOST)")
    ENV_VARS+=("AZURE_ACCOUNT_NAME=$(get_env_var AZURE_ACCOUNT_NAME)")
    ENV_VARS+=("AZURE_SECRET_KEY=$(get_env_var AZURE_SECRET_KEY)")
    ENV_VARS+=("AZURE_BACKEND_ENDPOINT=$(get_env_var AZURE_BACKEND_ENDPOINT)")

    # From k8s: Zenko account credentials
    ENV_VARS+=("ZENKO_ACCESS_KEY=$(kubectl get secret end2end-account-zenko -o jsonpath='{.data.AccessKeyId}' | base64 -d)")
    ENV_VARS+=("ZENKO_SECRET_KEY=$(kubectl get secret end2end-account-zenko -o jsonpath='{.data.SecretAccessKey}' | base64 -d)")

    # From k8s: Admin vault credentials
    ENV_VARS+=("ADMIN_ACCESS_KEY_ID=$(kubectl get secret end2end-management-vault-admin-creds.v1 -o jsonpath='{.data.accessKey}' | base64 -d)")
    ENV_VARS+=("ADMIN_SECRET_ACCESS_KEY=$(kubectl get secret end2end-management-vault-admin-creds.v1 -o jsonpath='{.data.secretKey}' | base64 -d)")
}

# =============================================================================
# CTST ONLY - Variables specific to cucumber tests
# =============================================================================
load_ctst() {
    load_common

    # From end2end.yaml
    ENV_VARS+=("SUBDOMAIN=$(get_env_var SUBDOMAIN)")

    # Hardcoded CTST values
    ENV_VARS+=("SSL=false")
    ENV_VARS+=("ZENKO_PORT=80")
    ENV_VARS+=("AZURE_ARCHIVE_ACCESS_TIER=Hot")
    ENV_VARS+=("AZURE_ARCHIVE_MANIFEST_ACCESS_TIER=Hot")

    # From end2end.yaml
    ENV_VARS+=("ZENKO_ACCOUNT_NAME=$(get_env_var ZENKO_ACCOUNT_NAME)")
    ENV_VARS+=("STORAGE_MANAGER_USER_NAME=$(get_env_var STORAGE_MANAGER_USER_NAME)")
    ENV_VARS+=("STORAGE_ACCOUNT_OWNER_USER_NAME=$(get_env_var STORAGE_ACCOUNT_OWNER_USER_NAME)")
    ENV_VARS+=("DATA_CONSUMER_USER_NAME=$(get_env_var DATA_CONSUMER_USER_NAME)")
    ENV_VARS+=("DATA_ACCESSOR_USER_NAME=$(get_env_var DATA_ACCESSOR_USER_NAME)")
    ENV_VARS+=("DR_SUBDOMAIN=$(get_env_var DR_SUBDOMAIN)")
    ENV_VARS+=("PROMETHEUS_NAME=$(get_env_var PROMETHEUS_NAME)")
    ENV_VARS+=("AZURE_BACKEND_QUEUE_ENDPOINT=$(get_env_var AZURE_BACKEND_QUEUE_ENDPOINT)")
    ENV_VARS+=("AZURE_ARCHIVE_BUCKET_NAME=$(get_env_var AZURE_ARCHIVE_BUCKET_NAME)")
    ENV_VARS+=("AZURE_ARCHIVE_BUCKET_NAME_2=$(get_env_var AZURE_ARCHIVE_BUCKET_NAME_2)")
    ENV_VARS+=("AZURE_ARCHIVE_QUEUE_NAME=$(get_env_var AZURE_ARCHIVE_QUEUE_NAME)")
    ENV_VARS+=("NOTIF_DEST_NAME=$(get_env_var NOTIF_DEST_NAME)")
    ENV_VARS+=("NOTIF_DEST_TOPIC=$(get_env_var NOTIF_DEST_TOPIC)")
    ENV_VARS+=("NOTIF_ALT_DEST_NAME=$(get_env_var NOTIF_ALT_DEST_NAME)")
    ENV_VARS+=("NOTIF_ALT_DEST_TOPIC=$(get_env_var NOTIF_ALT_DEST_TOPIC)")
    ENV_VARS+=("NOTIF_AUTH_DEST_NAME=$(get_env_var NOTIF_AUTH_DEST_NAME)")
    ENV_VARS+=("NOTIF_AUTH_DEST_TOPIC=$(get_env_var NOTIF_AUTH_DEST_TOPIC)")
    ENV_VARS+=("NOTIF_AUTH_DEST_USERNAME=$(get_env_var NOTIF_AUTH_DEST_USERNAME)")
    ENV_VARS+=("NOTIF_AUTH_DEST_PASSWORD=$(get_env_var NOTIF_AUTH_DEST_PASSWORD)")

    # From k8s: DR admin credentials (only exists if PRA is deployed)
    ENV_VARS+=("DR_ADMIN_ACCESS_KEY_ID=$(kubectl get secret end2end-pra-management-vault-admin-creds.v1 -o jsonpath='{.data.accessKey}' 2>/dev/null | base64 -d || true)")
    ENV_VARS+=("DR_ADMIN_SECRET_ACCESS_KEY=$(kubectl get secret end2end-pra-management-vault-admin-creds.v1 -o jsonpath='{.data.secretKey}' 2>/dev/null | base64 -d || true)")

    # From k8s: Kafka config
    local kafka_host_port kafka_port
    kafka_host_port=$(kubectl get secret -l app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=end2end \
        -o jsonpath='{.items[0].data.config\.json}' | base64 -d | jq -r '.kafka.hosts')
    kafka_port="${kafka_host_port#*:}"
    ENV_VARS+=("KAFKA_HOST_PORT=${kafka_host_port}")
    ENV_VARS+=("KAFKA_AUTH_HOST_PORT=end2end-base-queue-auth-0:${kafka_port}")

    # From k8s: Sorbet/kafka topics
    local sorbet_config
    sorbet_config=$(kubectl get secret -l "app.kubernetes.io/name=cold-sorbet-config-e2e-azure-archive,app.kubernetes.io/instance=end2end" \
        -o jsonpath='{.items[0].data.config\.json}' | base64 -d)
    ENV_VARS+=("KAFKA_DEAD_LETTER_TOPIC=$(echo "${sorbet_config}" | jq -r '."kafka-dead-letter-topic"')")
    ENV_VARS+=("KAFKA_OBJECT_TASK_TOPIC=$(echo "${sorbet_config}" | jq -r '."kafka-object-task-topic"')")
    ENV_VARS+=("KAFKA_GC_REQUEST_TOPIC=$(echo "${sorbet_config}" | jq -r '."kafka-gc-request-topic"')")

    # From k8s: Zenko resource values
    ENV_VARS+=("TIME_PROGRESSION_FACTOR=$(kubectl get zenko end2end -o jsonpath='{.metadata.annotations.zenko\.io/time-progression-factor}')")
    ENV_VARS+=("ZENKO_INSTANCE_ID=$(kubectl get zenko end2end -o jsonpath='{.status.instanceID}')")
    ENV_VARS+=("KAFKA_CLEANER_INTERVAL=$(kubectl get zenko end2end -o jsonpath='{.spec.kafkaCleaner.interval}')")
    ENV_VARS+=("SORBETD_RESTORE_TIMEOUT=$(kubectl get zenko end2end -o jsonpath='{.spec.sorbet.server.azure.restoreTimeout}')")
    ENV_VARS+=("UTILIZATION_SERVICE_HOST=$(kubectl get zenko end2end -o jsonpath='{.spec.scuba.api.ingress.hostname}')")

    # From k8s: Backbeat API config
    local cloudserver_config
    cloudserver_config=$(kubectl get secret -l app.kubernetes.io/name=connector-cloudserver-config,app.kubernetes.io/instance=end2end \
        -o jsonpath='{.items[0].data.config\.json}' | base64 -d)
    ENV_VARS+=("BACKBEAT_API_HOST=$(echo "${cloudserver_config}" | jq -r '.backbeat.host')")
    ENV_VARS+=("BACKBEAT_API_PORT=$(echo "${cloudserver_config}" | jq -r '.backbeat.port')")

    # From k8s: Service users credentials
    local lcbp_creds lcc_creds lcop_creds qp_creds sorbet_ak sorbet_sk
    lcbp_creds=$(kubectl get secret -l app.kubernetes.io/name=backbeat-lcbp-user-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.backbeat-lifecycle-bp-1\.json}' | base64 -d)
    lcc_creds=$(kubectl get secret -l app.kubernetes.io/name=backbeat-lcc-user-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.backbeat-lifecycle-conductor-1\.json}' | base64 -d)
    lcop_creds=$(kubectl get secret -l app.kubernetes.io/name=backbeat-lcop-user-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.backbeat-lifecycle-op-1\.json}' | base64 -d)
    qp_creds=$(kubectl get secret -l app.kubernetes.io/name=backbeat-qp-user-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.backbeat-qp-1\.json}' | base64 -d)
    sorbet_ak=$(kubectl get secret -l app.kubernetes.io/name=sorbet-fwd-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.accessKey}' | base64 -d)
    sorbet_sk=$(kubectl get secret -l app.kubernetes.io/name=sorbet-fwd-creds,app.kubernetes.io/instance=end2end -o jsonpath='{.items[0].data.secretKey}' | base64 -d)

    local service_users_creds
    service_users_creds=$(echo '{"backbeat-lifecycle-bp-1":'"${lcbp_creds}"',"backbeat-lifecycle-conductor-1":'"${lcc_creds}"',"backbeat-lifecycle-op-1":'"${lcop_creds}"',"backbeat-qp-1":'"${qp_creds}"',"sorbet-fwd-2":{"accessKey":"'"${sorbet_ak}"'","secretKey":"'"${sorbet_sk}"'"}}')
    ENV_VARS+=("SERVICE_USERS_CREDENTIALS=${service_users_creds}")
}

# =============================================================================
# E2E ONLY - Variables specific to zenko_tests (mocha)
# =============================================================================
load_e2e() {
    load_common

    # From end2end.yaml
    ENV_VARS+=("AWS_BACKEND_SOURCE_LOCATION=$(get_env_var AWS_BACKEND_SOURCE_LOCATION)")
    ENV_VARS+=("AWS_BACKEND_DESTINATION_LOCATION=$(get_env_var AWS_BACKEND_DESTINATION_LOCATION)")
    ENV_VARS+=("AWS_BACKEND_DESTINATION_FAIL_LOCATION=$(get_env_var AWS_BACKEND_DESTINATION_FAIL_LOCATION)")
    ENV_VARS+=("GCP_BACKEND_DESTINATION_LOCATION=$(get_env_var GCP_BACKEND_DESTINATION_LOCATION)")
    ENV_VARS+=("AZURE_BACKEND_DESTINATION_LOCATION=$(get_env_var AZURE_BACKEND_DESTINATION_LOCATION)")
    ENV_VARS+=("COLD_BACKEND_DESTINATION_LOCATION=$(get_env_var COLD_BACKEND_DESTINATION_LOCATION)")
    ENV_VARS+=("AZURE_ARCHIVE_BACKEND_DESTINATION_LOCATION=$(get_env_var AZURE_ARCHIVE_BACKEND_DESTINATION_LOCATION)")
    ENV_VARS+=("MIRIA_BACKEND_DESTINATION_LOCATION=$(get_env_var MIRIA_BACKEND_DESTINATION_LOCATION)")
    ENV_VARS+=("LOCATION_QUOTA_BACKEND=$(get_env_var LOCATION_QUOTA_BACKEND)")
    ENV_VARS+=("AWS_BUCKET_NAME=$(get_env_var AWS_BUCKET_NAME)")
    ENV_VARS+=("AWS_CRR_BUCKET_NAME=$(get_env_var AWS_CRR_BUCKET_NAME)")
    ENV_VARS+=("AWS_FAIL_BUCKET_NAME=$(get_env_var AWS_FAIL_BUCKET_NAME)")
    ENV_VARS+=("AZURE_CRR_BUCKET_NAME=$(get_env_var AZURE_CRR_BUCKET_NAME)")
    ENV_VARS+=("AZURE_ARCHIVE_BUCKET_NAME=$(get_env_var AZURE_ARCHIVE_BUCKET_NAME)")
    ENV_VARS+=("GCP_CRR_BUCKET_NAME=$(get_env_var GCP_CRR_BUCKET_NAME)")
    ENV_VARS+=("GCP_CRR_MPU_BUCKET_NAME=$(get_env_var GCP_CRR_MPU_BUCKET_NAME)")
    ENV_VARS+=("GCP_ACCESS_KEY=$(get_env_var GCP_ACCESS_KEY)")
    ENV_VARS+=("GCP_SECRET_KEY=$(get_env_var GCP_SECRET_KEY)")
    ENV_VARS+=("GCP_BACKEND_SERVICE_KEY=$(get_env_var GCP_BACKEND_SERVICE_KEY)")
    ENV_VARS+=("GCP_BACKEND_SERVICE_EMAIL=$(get_env_var GCP_BACKEND_SERVICE_EMAIL)")
    ENV_VARS+=("AWS_ENDPOINT=$(get_env_var AWS_ENDPOINT)")
    ENV_VARS+=("AWS_ACCESS_KEY=$(get_env_var AWS_ACCESS_KEY)")
    ENV_VARS+=("AWS_SECRET_KEY=$(get_env_var AWS_SECRET_KEY)")
    ENV_VARS+=("VERIFY_CERTIFICATES=$(get_env_var VERIFY_CERTIFICATES)")
    ENV_VARS+=("ENABLE_RING_TESTS=$(get_env_var ENABLE_RING_TESTS)")
    ENV_VARS+=("RING_S3C_ACCESS_KEY=$(get_env_var RING_S3C_ACCESS_KEY)")
    ENV_VARS+=("RING_S3C_SECRET_KEY=$(get_env_var RING_S3C_SECRET_KEY)")
    ENV_VARS+=("RING_S3C_ENDPOINT=$(get_env_var RING_S3C_ENDPOINT)")
    ENV_VARS+=("RING_S3C_BACKEND_SOURCE_LOCATION=$(get_env_var RING_S3C_BACKEND_SOURCE_LOCATION)")
    ENV_VARS+=("RING_S3C_INGESTION_SRC_BUCKET_NAME=$(get_env_var RING_S3C_INGESTION_SRC_BUCKET_NAME)")
    ENV_VARS+=("RING_S3C_BACKEND_SOURCE_NON_VERSIONED_LOCATION=$(get_env_var RING_S3C_BACKEND_SOURCE_NON_VERSIONED_LOCATION)")
    ENV_VARS+=("RING_S3C_INGESTION_SRC_NON_VERSIONED_BUCKET_NAME=$(get_env_var RING_S3C_INGESTION_SRC_NON_VERSIONED_BUCKET_NAME)")
    ENV_VARS+=("RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE=$(get_env_var RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE)")
    ENV_VARS+=("CRR_SOURCE_LOCATION_NAME=$(get_env_var CRR_SOURCE_LOCATION_NAME)")
    ENV_VARS+=("CRR_DESTINATION_LOCATION_NAME=$(get_env_var CRR_DESTINATION_LOCATION_NAME)")
    ENV_VARS+=("CRR_ROLE_NAME=$(get_env_var CRR_ROLE_NAME)")
    ENV_VARS+=("BACKBEAT_BUCKET_CHECK_TIMEOUT_S=$(get_env_var BACKBEAT_BUCKET_CHECK_TIMEOUT_S)")
    ENV_VARS+=("MOCHA_FILE=$(get_env_var MOCHA_FILE)")

    # Derived endpoints
    ENV_VARS+=("CLOUDSERVER_HOST=end2end-connector-s3api.default.svc.cluster.local")
    ENV_VARS+=("CLOUDSERVER_ENDPOINT=http://end2end-connector-s3api.default.svc.cluster.local:80")
    ENV_VARS+=("VAULT_ENDPOINT=http://end2end-management-vault-iam-admin-api:80")
    ENV_VARS+=("VAULT_STS_ENDPOINT=http://end2end-connector-vault-sts-api:80")
    ENV_VARS+=("BACKBEAT_API_ENDPOINT=http://end2end-management-backbeat-api.default.svc.cluster.local:80")

    # From k8s: MongoDB config
    local cloudserver_secret
    cloudserver_secret=$(kubectl get secret -l app.kubernetes.io/name=connector-cloudserver-config,app.kubernetes.io/instance=end2end \
        -o jsonpath="{.items[0].data.config\.json}" | base64 -d)
    ENV_VARS+=("MONGO_DATABASE=$(echo "${cloudserver_secret}" | jq -r '.mongodb.database')")
    ENV_VARS+=("MONGO_READ_PREFERENCE=$(echo "${cloudserver_secret}" | jq -r '.mongodb.readPreference')")
    ENV_VARS+=("MONGO_REPLICA_SET_HOSTS=$(echo "${cloudserver_secret}" | jq -r '.mongodb.replicaSetHosts')")
    ENV_VARS+=("MONGO_SHARD_COLLECTION=$(echo "${cloudserver_secret}" | jq -r '.mongodb.shardCollections')")
    ENV_VARS+=("MONGO_WRITE_CONCERN=$(echo "${cloudserver_secret}" | jq -r '.mongodb.writeConcern')")
    ENV_VARS+=("MONGO_AUTH_USERNAME=$(echo "${cloudserver_secret}" | jq -r '.mongodb.authCredentials.username')")
    ENV_VARS+=("MONGO_AUTH_PASSWORD=$(echo "${cloudserver_secret}" | jq -r '.mongodb.authCredentials.password')")

    # From k8s: CRR account credentials
    local crr_src crr_dst
    crr_src=$(get_env_var CRR_SOURCE_ACCOUNT_NAME)
    crr_dst=$(get_env_var CRR_DESTINATION_ACCOUNT_NAME)
    local src_ak src_sk src_st src_id dst_ak dst_sk dst_st dst_id
    src_ak=$(kubectl get secret "end2end-account-${crr_src}" -o jsonpath='{.data.AccessKeyId}' | base64 -d)
    src_sk=$(kubectl get secret "end2end-account-${crr_src}" -o jsonpath='{.data.SecretAccessKey}' | base64 -d)
    src_st=$(kubectl get secret "end2end-account-${crr_src}" -o jsonpath='{.data.SessionToken}' | base64 -d)
    src_id=$(kubectl get secret "end2end-account-${crr_src}" -o jsonpath='{.data.AccountId}' | base64 -d)
    dst_ak=$(kubectl get secret "end2end-account-${crr_dst}" -o jsonpath='{.data.AccessKeyId}' | base64 -d)
    dst_sk=$(kubectl get secret "end2end-account-${crr_dst}" -o jsonpath='{.data.SecretAccessKey}' | base64 -d)
    dst_st=$(kubectl get secret "end2end-account-${crr_dst}" -o jsonpath='{.data.SessionToken}' | base64 -d)
    dst_id=$(kubectl get secret "end2end-account-${crr_dst}" -o jsonpath='{.data.AccountId}' | base64 -d)
    ENV_VARS+=("CRR_SOURCE_INFO={\"AccessKeyId\":\"${src_ak}\",\"SecretAccessKey\":\"${src_sk}\",\"SessionToken\":\"${src_st}\",\"AccountId\":\"${src_id}\"}")
    ENV_VARS+=("CRR_DESTINATION_INFO={\"AccessKeyId\":\"${dst_ak}\",\"SecretAccessKey\":\"${dst_sk}\",\"SessionToken\":\"${dst_st}\",\"AccountId\":\"${dst_id}\"}")

    # From k8s: Zenko account session token
    ENV_VARS+=("ZENKO_SESSION_TOKEN=$(kubectl get secret end2end-account-zenko -o jsonpath='{.data.SessionToken}' | base64 -d)")
}

# =============================================================================
# MAIN
# =============================================================================
case "$SUITE" in
    common)
        load_common
        ;;
    ctst)
        load_ctst
        ;;
    e2e)
        load_e2e
        ;;
    *)
        echo "Usage: source load-config.sh [common|ctst|e2e]" >&2
        exit 1
        ;;
esac
