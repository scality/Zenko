#!/bin/bash
set -euo pipefail

# User-configurable variables
NAMESPACE="${NAMESPACE:-default}"
INSTANCE_ID="${INSTANCE_ID:-end2end}"
SUBDOMAIN="${SUBDOMAIN:-zenko.local}"
E2E_IMAGE="${E2E_IMAGE:-ghcr.io/scality/zenko/zenko-e2e:latest}"
E2E_CTST_IMAGE="${E2E_CTST_IMAGE:-ghcr.io/scality/zenko/zenko-e2e-ctst:latest}"
KUBECONFIG_FILE="${KUBECONFIG_FILE:-${HOME}/.kube/config}"

# CTST environment variables
DR_SUBDOMAIN="${DR_SUBDOMAIN:-dr.zenko.local}"
OIDC_USERNAME="${OIDC_USERNAME:-storage_manager}"
OIDC_PASSWORD="${OIDC_PASSWORD:-123}"
OIDC_HOST="${OIDC_HOST:-keycloak.zenko.local}"
OIDC_REALM="${OIDC_REALM:-zenko}"
OIDC_CLIENT_ID="${OIDC_CLIENT_ID:-zenko-ui}"
PARALLEL_RUNS="${PARALLEL_RUNS:-}"

# MongoDB for tests connecting to MongoDB directly
CLOUDSERVER_SECRET="$(kubectl get secret -l app.kubernetes.io/name=connector-cloudserver-config,app.kubernetes.io/instance=end2end \
   -o jsonpath="{.items[0].data.config\.json}" | base64 -di)"
MONGO_DATABASE=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.database')
MONGO_READ_PREFERENCE=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.readPreference')
MONGO_REPLICA_SET_HOSTS=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.replicaSetHosts')
MONGO_SHARD_COLLECTION=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.shardCollections')
MONGO_WRITE_CONCERN=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.writeConcern')
MONGO_AUTH_USERNAME=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.authCredentials.username')
MONGO_AUTH_PASSWORD=$(echo "${CLOUDSERVER_SECRET}" | jq -r '.mongodb.authCredentials.password')

# Script-internal variables
MANAGED_BY_LABEL="zenko-run-tests-script"
CLUSTER_ROLE_BINDING_NAME="ctst-cluster-admin-for-${NAMESPACE}"

# Admin credentials
ADMIN_ACCESS_KEY_ID=$(kubectl get secret end2end-management-vault-admin-creds.v1 -o jsonpath='{.data.accessKey}' | base64 -d)
ADMIN_SECRET_ACCESS_KEY=$(kubectl get secret end2end-management-vault-admin-creds.v1  -o jsonpath='{.data.secretKey}' | base64 -d)

# Specific to old test suite
VAULT_STS_ENDPOINT="http://${INSTANCE_ID}-connector-vault-sts-api:80"
VAULT_ENDPOINT="http://${INSTANCE_ID}-management-vault-iam-admin-api:80"

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS] [-- ADDITIONAL_TEST_ARGS]

Runs Zenko integration tests as a Kubernetes Job.

Options:
  --type <type>        Required. Test type to run (e2e, smoke, backbeat, ctst).
  --kubeconfig <path>  Path to the kubeconfig file.
  --cleanup            Remove resources created by this script and exit.
  --help               Display this help message and exit.

ADDITIONAL_TEST_ARGS:
  For ctst: Arguments after '--' are passed directly to the test command (e.g., --tags @PRA).
  For e2e:  First argument after '--' must be an npm script name (e.g., test_operator, test_iam_policies, test_object_api).
  For smoke: No additional arguments needed.
  For backbeat: No additional arguments needed.
EOF
    exit 1
}

check_deps() {
    command -v kubectl >/dev/null || { echo "Error: kubectl is not installed." >&2; exit 1; }
    command -v jq >/dev/null || { echo "Error: jq is not installed." >&2; exit 1; }
}

cleanup() {
    echo "Cleaning up script-managed resources..."
    kubectl --kubeconfig "${KUBECONFIG_FILE}" delete \
        clusterrolebinding "${CLUSTER_ROLE_BINDING_NAME}" \
        --ignore-not-found=true
    kubectl --kubeconfig "${KUBECONFIG_FILE}" delete job \
        -n "${NAMESPACE}" \
        -l "managed-by=${MANAGED_BY_LABEL}" \
        --ignore-not-found=true
    echo "Cleanup complete."
}

run_prerequisite_checks() {
    echo "Performing prerequisite checks..."
    if ! [[ -f "${KUBECONFIG_FILE}" ]]; then
        echo "Error: Kubeconfig file not found: ${KUBECONFIG_FILE}" >&2
        exit 1
    fi
    if ! kubectl --kubeconfig "${KUBECONFIG_FILE}" cluster-info >/dev/null; then
        echo "Error: Cannot connect to Kubernetes cluster." >&2
        exit 1
    fi
    if ! kubectl --kubeconfig "${KUBECONFIG_FILE}" get zenko "${INSTANCE_ID}" -n "${NAMESPACE}" >/dev/null; then
        echo "Error: Zenko instance '${INSTANCE_ID}' not found in namespace '${NAMESPACE}'." >&2
        exit 1
    fi
    echo "All checks passed."
}

setup_ctst_permissions() {
    echo "Applying 'ctst' cluster-admin permissions..."
    cat <<EOF | kubectl --kubeconfig "${KUBECONFIG_FILE}" apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ${CLUSTER_ROLE_BINDING_NAME}
  labels:
    managed-by: ${MANAGED_BY_LABEL}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: default
  namespace: ${NAMESPACE}
EOF
}

wait_for_job() {
    local job_name="$1"
    echo "Waiting for pod to be created by job '${job_name}'..."
    local pod_name=""
    for _ in $(seq 1 60); do
        pod_name=$(kubectl --kubeconfig "${KUBECONFIG_FILE}" get pods -l "job-name=${job_name}" -n "${NAMESPACE}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
        if [[ -n "${pod_name}" ]]; then
            break
        fi
        sleep 1
    done

    if [[ -z "${pod_name}" ]]; then
        echo "Error: Pod for job '${job_name}' was not created in time." >&2
        kubectl --kubeconfig "${KUBECONFIG_FILE}" describe "job/${job_name}" -n "${NAMESPACE}"
        exit 1
    fi
    echo "Found pod '${pod_name}'."

    echo "Waiting for pod to become ready..."
    if ! kubectl --kubeconfig "${KUBECONFIG_FILE}" wait "pod/${pod_name}" -n "${NAMESPACE}" --for=condition=Ready --timeout=300s; then
        echo "Error: Pod '${pod_name}' did not become ready." >&2
        kubectl --kubeconfig "${KUBECONFIG_FILE}" describe "pod/${pod_name}" -n "${NAMESPACE}"
        exit 1
    fi

    echo "Pod is ready. Streaming logs..."
    kubectl --kubeconfig "${KUBECONFIG_FILE}" logs -f "${pod_name}" -n "${NAMESPACE}"

    echo "Log stream finished. Waiting for job to complete..."
    if ! kubectl --kubeconfig "${KUBECONFIG_FILE}" wait "job/${job_name}" -n "${NAMESPACE}" --for=condition=Complete --timeout=60s 2>/dev/null; then
        # Job didn't complete successfully, it may have failed
        echo "Job did not complete successfully."
    fi

    echo "Checking job final status..."
    local succeeded
    succeeded=$(kubectl --kubeconfig "${KUBECONFIG_FILE}" get "job/${job_name}" -n "${NAMESPACE}" -o jsonpath='{.status.succeeded}')

    if [[ "${succeeded}" == "1" ]]; then
        echo "Test job '${job_name}' completed successfully."
    else
        echo "Error: Test job '${job_name}' failed." >&2
        echo "--- Final Job Description ---"
        kubectl --kubeconfig "${KUBECONFIG_FILE}" describe "job/${job_name}" -n "${NAMESPACE}"
        exit 1
    fi
}

run_test_job() {
    local test_type="$1"
    local -n additional_args_ref=$2
    local job_name="zenko-${test_type}-test-$(date +%s)"

    local test_image=""
    local -a test_command=()

    case "${test_type}" in
        ctst)
            test_image="${E2E_CTST_IMAGE}"
            local world_params
            world_params=$(jq -cn \
                --arg namespace "${NAMESPACE}" \
                --arg subdomain "${SUBDOMAIN}" \
                --arg zenko_name "${INSTANCE_ID:-end2end}" \
                --arg dr_subdomain "${DR_SUBDOMAIN:-dr.zenko.local}" \
                --arg keycloak_username "${OIDC_USERNAME:-storage_manager}" \
                --arg keycloak_password "${OIDC_PASSWORD:-123}" \
                --arg keycloak_host "${OIDC_HOST:-keycloak.zenko.local}" \
                --arg keycloak_realm "${OIDC_REALM:-zenko}" \
                --arg keycloak_client_id "${OIDC_CLIENT_ID:-zenko-ui}" \
                --arg azure_account_name "${AZURE_ACCOUNT_NAME:-devstoreaccount1}" \
                --arg azure_account_key "${AZURE_SECRET_KEY:-Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==}" \
                --arg kafka_external_ips "${KAFKA_EXTERNAL_IPS:-}" \
                --arg prometheus_name "${PROMETHEUS_NAME}" \
                --arg notification_destination "${NOTIF_DEST_NAME}" \
                --arg notification_destination_topic "${NOTIF_DEST_TOPIC}" \
                --arg notification_destination_alt "${NOTIF_ALT_DEST_NAME}" \
                --arg notification_destination_topic_alt "${NOTIF_ALT_DEST_TOPIC}" \
                '{ "Namespace": $namespace, "subdomain": $subdomain, "ZenkoName": $zenko_name, "DRSubdomain": $dr_subdomain, "KeycloakUsername": $keycloak_username, "KeycloakPassword": $keycloak_password, "KeycloakHost": $keycloak_host, "KeycloakRealm": $keycloak_realm, "KeycloakClientId": $keycloak_client_id, "AzureAccountName": $azure_account_name, "AzureAccountKey": $azure_account_key, "KafkaExternalIps": $kafka_external_ips, "NotificationDestination": $notification_destination, "NotificationDestinationTopic": $notification_destination_topic, "NotificationDestinationAlt": $notification_destination_alt, "NotificationDestinationTopicAlt": $notification_destination_topic_alt, "PrometheusName": $prometheus_name }')
            local parallel_runs=${PARALLEL_RUNS:-$(( ( $(nproc || echo 2) + 1 ) / 2 ))}
            test_command=(
                "./run" "premerge" "${world_params}" "--parallel" "${parallel_runs}"
                "--retry" "3" "--retry-tag-filter" "@Flaky"
                "--format" "junit:/reports/ctst-junit.xml"
            )
            test_command+=("${additional_args_ref[@]}")
            ;;
        e2e)
            test_image="${E2E_IMAGE}"
            if [[ ${#additional_args_ref[@]} -eq 0 ]]; then
                echo "Error: e2e test type requires a test script name" >&2
                exit 1
            fi
            test_command=("sh" "-c" "cd node_tests && npm run ${additional_args_ref[0]}")
            ;;
        smoke)
            test_image="${E2E_IMAGE}"
            test_command=("sh" "-c" "cd node_tests && npm run test_smoke")
            ;;
        backbeat)
            test_image="${E2E_IMAGE}"
            test_command=("sh" "-c" "cd node_tests && ./gcp_shim.sh && npm run test_all_extensions")
            ;;
        *)
            echo "Error: Unknown test type '${test_type}'." >&2
            exit 1
            ;;
    esac

    echo "Creating test job: ${job_name}"
    echo "  Image: ${test_image}"
    echo "  Command: ${test_command[*]}"

    cat <<EOF | kubectl --kubeconfig "${KUBECONFIG_FILE}" apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: ${job_name}
  namespace: ${NAMESPACE}
  labels:
    app: zenko-test
    managed-by: ${MANAGED_BY_LABEL}
spec:
  ttlSecondsAfterFinished: 600
  backoffLimit: 0
  activeDeadlineSeconds: 18000
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: test
        image: ${test_image}
        command:
$(for arg in "${test_command[@]}"; do echo "        - \"${arg//\"/\\\"}\""; done)
        env:
        - name: NAMESPACE
          value: "${NAMESPACE}"
$(if [[ "$test_type" == "ctst" ]]; then
    local version
    version=$(grep -Po 'VERSION="\K[^"]*' ../../VERSION 2>/dev/null || echo "unknown")
cat <<EOT
        - name: TARGET_VERSION
          value: "${version}"
        - name: SEED_KEYCLOAK_DEFAULT_ROLES
          value: "true"
        - name: VERBOSE
          value: "1"
        - name: AZURE_BLOB_URL
          value: "https://devstoreaccount1.blob.azure-mock.${SUBDOMAIN}"
        - name: AZURE_QUEUE_URL
          value: "https://devstoreaccount1.queue.azure-mock.${SUBDOMAIN}"
EOT
else
cat <<EOT
        # Environment variables for the old test suite
        # This will probably be removed in the future
        - name: S3_ENDPOINT
          value: "http://${INSTANCE_ID}-connector-s3api.${NAMESPACE}.svc.cluster.local:80"
        - name: CLOUDSERVER_ENDPOINT
          value: "http://${INSTANCE_ID}-connector-s3api.${NAMESPACE}.svc.cluster.local:80"
        - name: CLOUDSERVER_HOST
          value: "${INSTANCE_ID}-connector-s3api.${NAMESPACE}.svc.cluster.local"
        - name: CLOUDSERVER_PORT
          value: "80"
        - name: VAULT_ENDPOINT
          value: "http://${INSTANCE_ID}-management-vault-iam-admin-api.${NAMESPACE}.svc.cluster.local:80"
        - name: ZENKO_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: end2end-account-zenko
              key: AccessKeyId
        - name: ZENKO_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: end2end-account-zenko
              key: SecretAccessKey
        - name: ZENKO_SESSION_TOKEN
          valueFrom:
            secretKeyRef:
              name: end2end-account-zenko
              key: SessionToken
        - name: ADMIN_ACCESS_KEY_ID
          valueFrom:
            secretKeyRef:
              name: end2end-management-vault-admin-creds.v1
              key: accessKey
        - name: ADMIN_SECRET_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: end2end-management-vault-admin-creds.v1
              key: secretKey
        - name: MONGO_DATABASE
          value: "${MONGO_DATABASE}"
        - name: MONGO_READ_PREFERENCE
          value: "${MONGO_READ_PREFERENCE}"
        - name: MONGO_REPLICA_SET_HOSTS
          value: "${MONGO_REPLICA_SET_HOSTS}"
        - name: MONGO_SHARD_COLLECTION
          value: "${MONGO_SHARD_COLLECTION}"
        - name: MONGO_WRITE_CONCERN
          value: "${MONGO_WRITE_CONCERN}"
        - name: MONGO_AUTH_USERNAME
          value: "${MONGO_AUTH_USERNAME}"
        - name: MONGO_AUTH_PASSWORD
          value: "${MONGO_AUTH_PASSWORD}"
        - name: AWS_ACCESS_KEY
          value: "${AWS_ACCESS_KEY}"
        - name: AWS_SECRET_KEY
          value: "${AWS_SECRET_KEY}"
        - name: AWS_ENDPOINT
          value: "${AWS_ENDPOINT}"
        - name: AWS_BACKEND_SOURCE_LOCATION
          value: "${AWS_BACKEND_SOURCE_LOCATION}"
        - name: AWS_BACKEND_DESTINATION_LOCATION
          value: "${AWS_BACKEND_DESTINATION_LOCATION}"
        - name: AWS_CRR_BUCKET_NAME
          value: "${AWS_CRR_BUCKET_NAME}"
        - name: AZURE_ACCOUNT_NAME
          value: "${AZURE_ACCOUNT_NAME}"
        - name: AZURE_SECRET_KEY
          value: "${AZURE_SECRET_KEY}"
        - name: AZURE_BACKEND_DESTINATION_LOCATION
          value: "${AZURE_BACKEND_DESTINATION_LOCATION}"
        - name: VERIFY_CERTIFICATES
          value: "false"
        - name: AZURE_ARCHIVE_BACKEND_DESTINATION_LOCATION
          value: "${AZURE_ARCHIVE_BACKEND_DESTINATION_LOCATION}"
        - name: AZURE_BACKEND_ENDPOINT
          value: "${AZURE_BACKEND_ENDPOINT}"
        - name: AZURE_CRR_BUCKET_NAME
          value: "${AZURE_CRR_BUCKET_NAME}"
        - name: GCP_BACKEND_DESTINATION_LOCATION
          value: "${GCP_BACKEND_DESTINATION_LOCATION}"
        - name: GCP_CRR_BUCKET_NAME
          value: "${GCP_CRR_BUCKET_NAME}"
        - name: GCP_CRR_MPU_BUCKET_NAME
          value: "${GCP_CRR_MPU_BUCKET_NAME}"
        - name: RING_S3C_ACCESS_KEY
          value: "${RING_S3C_ACCESS_KEY}"
        - name: RING_S3C_SECRET_KEY
          value: "${RING_S3C_SECRET_KEY}"
        - name: RING_S3C_ENDPOINT
          value: "${RING_S3C_ENDPOINT}"
        - name: RING_S3C_BACKEND_SOURCE_LOCATION
          value: "${RING_S3C_BACKEND_SOURCE_LOCATION}"
        - name: RING_S3C_INGESTION_SRC_BUCKET_NAME
          value: "${RING_S3C_INGESTION_SRC_BUCKET_NAME}"
        - name: RING_S3C_BACKEND_SOURCE_NON_VERSIONED_LOCATION
          value: "${RING_S3C_BACKEND_SOURCE_NON_VERSIONED_LOCATION}"
        - name: RING_S3C_INGESTION_SRC_NON_VERSIONED_BUCKET_NAME
          value: "${RING_S3C_INGESTION_SRC_NON_VERSIONED_BUCKET_NAME}"
        - name: RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE
          value: "${RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE}"
        - name: COLD_BACKEND_DESTINATION_LOCATION
          value: "${COLD_BACKEND_DESTINATION_LOCATION}"
        - name: OIDC_PASSWORD
          value: "${OIDC_PASSWORD}"
        - name: OIDC_HOST
          value: "${OIDC_HOST}"
        - name: OIDC_REALM
          value: "${OIDC_REALM}"
        - name: OIDC_CLIENT_ID
          value: "${OIDC_CLIENT_ID}"
        - name: VAULT_STS_ENDPOINT
          value: "${VAULT_STS_ENDPOINT}"
        - name: VAULT_ENDPOINT
          value: "${VAULT_ENDPOINT}"
EOT
fi)
        volumeMounts:
$(if [[ "$test_type" == "ctst" ]]; then
cat <<'EOT'
        - name: reports
          mountPath: /reports
        - name: cold-data
          mountPath: /cold-data
EOT
fi)
      volumes:
$(if [[ "$test_type" == "ctst" ]]; then
cat <<'EOT'
      - name: reports
        hostPath:
          path: /tmp/zenko-test-reports
          type: DirectoryOrCreate
      - name: cold-data
        persistentVolumeClaim:
          claimName: sorbet-data
EOT
fi)
EOF

    wait_for_job "${job_name}"
}

main() {
    local test_type=""
    local action="run"
    local additional_args=()

    while [[ $# -gt 0 ]]; do
        case $1 in
            --type) test_type="$2"; shift 2 ;;
            --kubeconfig) KUBECONFIG_FILE="$2"; shift 2 ;;
            --cleanup) action="cleanup"; shift 1 ;;
            --help) usage ;;
            --) shift; additional_args=("$@"); break ;;
            *) echo "Error: Unknown option: $1" >&2; usage ;;
        esac
    done

    if [[ "${action}" == "cleanup" ]]; then
        cleanup
        exit 0
    fi
    
    if [[ -z "${test_type}" ]]; then
        echo "Error: Test type is required via the --type flag." >&2
        usage
    fi

    check_deps
    run_prerequisite_checks

    if [[ "${test_type}" == "ctst" ]]; then
        setup_ctst_permissions
    fi

    run_test_job "${test_type}" additional_args

    echo "Test run finished."
}

main "$@"
