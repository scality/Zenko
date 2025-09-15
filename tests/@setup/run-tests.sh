#!/bin/bash
set -euo pipefail

# Simple script to run tests against a Zenko cluster
# Usage: ./run-tests.sh [path-to-kubeconfig] [test-type]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KUBECONFIG_FILE="${1:-$HOME/.kube/config}"
TEST_TYPE="${2:-ctst}"  # ctst, e2e, smoke, etc.

# For CTST, capture additional arguments (like --tags @PRA)
shift 2 || true
ADDITIONAL_ARGS=("$@")

# Default environment variables - modify these as needed
export NAMESPACE="${NAMESPACE:-default}"
export INSTANCE_ID="${INSTANCE_ID:-end2end}"
export SUBDOMAIN="${SUBDOMAIN:-zenko.local}"
export E2E_IMAGE="${E2E_IMAGE:-ghcr.io/scality/zenko/zenko-e2e:latest}"
export E2E_CTST_IMAGE="${E2E_CTST_IMAGE:-ghcr.io/scality/zenko/zenko-e2e-ctst:latest}"
export JOB_TIMEOUT="${JOB_TIMEOUT:-3600}"

# Test environment endpoints
export OIDC_REALM="${OIDC_REALM:-zenko}"
export OIDC_CLIENT_ID="${OIDC_CLIENT_ID:-zenko-ui}"
export OIDC_USERNAME="${OIDC_USERNAME:-storage_manager}"
export OIDC_PASSWORD="${OIDC_PASSWORD:-123}"
export OIDC_HOST="${OIDC_HOST:-keycloak.zenko.local}"
export OIDC_ENDPOINT="http://keycloak-http.${NAMESPACE}.svc.cluster.local:8080/realms/${OIDC_REALM}"
export MANAGEMENT_ENDPOINT="http://zenko-connector.${NAMESPACE}.svc.cluster.local:8000/api/v1"
export S3_ENDPOINT="http://cloudserver.${NAMESPACE}.svc.cluster.local:80"

# CTST-specific environment variables
export PARALLEL_RUNS="${PARALLEL_RUNS:-$(( ( $(nproc) + 1 ) / 2 ))}"
export RETRIES="${RETRIES:-3}"
export JUNIT_REPORT_PATH="${JUNIT_REPORT_PATH:-ctst-junit.xml}"
export DR_SUBDOMAIN="${DR_SUBDOMAIN:-dr.zenko.local}"
export AZURE_ACCOUNT_NAME="${AZURE_ACCOUNT_NAME:-devstoreaccount1}"
export AZURE_SECRET_KEY="${AZURE_SECRET_KEY:-Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==}"
export AZURE_ARCHIVE_BUCKET_NAME="${AZURE_ARCHIVE_BUCKET_NAME:-archive-container}"
export AZURE_ARCHIVE_BUCKET_NAME_2="${AZURE_ARCHIVE_BUCKET_NAME_2:-archive-container-2}"
export AZURE_ARCHIVE_QUEUE_NAME="${AZURE_ARCHIVE_QUEUE_NAME:-archive-queue}"
export AZURE_BACKEND_ENDPOINT="${AZURE_BACKEND_ENDPOINT:-}"
export AZURE_BACKEND_QUEUE_ENDPOINT="${AZURE_BACKEND_QUEUE_ENDPOINT:-}"

echo "=== Zenko Test Execution ==="
echo "Kubeconfig: ${KUBECONFIG_FILE}"
echo "Test Type: ${TEST_TYPE}"
echo "Namespace: ${NAMESPACE}"
echo "Instance ID: ${INSTANCE_ID}"
echo "Subdomain: ${SUBDOMAIN}"
echo

# Verify kubeconfig exists and is accessible
if [[ ! -f "${KUBECONFIG_FILE}" ]]; then
    echo "Error: Kubeconfig file not found: ${KUBECONFIG_FILE}"
    exit 1
fi

# Test cluster connectivity
echo "Testing cluster connectivity..."
if ! kubectl --kubeconfig="${KUBECONFIG_FILE}" cluster-info >/dev/null 2>&1; then
    echo "Error: Cannot connect to Kubernetes cluster"
    exit 1
fi
echo "Connected to cluster"

# Check if Zenko is deployed and ready
echo "Checking Zenko deployment..."
if ! kubectl --kubeconfig="${KUBECONFIG_FILE}" get zenko "${INSTANCE_ID}" -n "${NAMESPACE}" >/dev/null 2>&1; then
    echo "Error: Zenko instance '${INSTANCE_ID}' not found in namespace '${NAMESPACE}'"
    echo "Please run setup first: ./setup-tests.sh ${KUBECONFIG_FILE}"
    exit 1
fi
echo "Zenko instance found"

# Handle CTST-specific setup
if [[ "${TEST_TYPE}" == "ctst" ]]; then
    echo "Setting up CTST cluster-admin permissions..."
    cat <<EOF | kubectl --kubeconfig="${KUBECONFIG_FILE}" apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ctst-cluster-admin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: default
  namespace: ${NAMESPACE}
EOF

    # Get VERSION from the repository
    VERSION=$(cat ../../../VERSION 2>/dev/null | grep -Po 'VERSION="\K[^"]*' || echo "unknown")
    
    # Build CTST world parameters
    WORLD_PARAMETERS=$(jq -c --null-input \
        --arg namespace "${NAMESPACE}" \
        --arg subdomain "${SUBDOMAIN}" \
        --arg dr_subdomain "${DR_SUBDOMAIN}" \
        --arg keycloak_username "${OIDC_USERNAME}" \
        --arg keycloak_password "${OIDC_PASSWORD}" \
        --arg keycloak_host "${OIDC_HOST}" \
        --arg keycloak_realm "${OIDC_REALM}" \
        --arg keycloak_client_id "${OIDC_CLIENT_ID}" \
        --arg azure_account_name "${AZURE_ACCOUNT_NAME}" \
        --arg azure_account_key "${AZURE_SECRET_KEY}" \
        --arg azure_archive_container "${AZURE_ARCHIVE_BUCKET_NAME}" \
        --arg azure_archive_container2 "${AZURE_ARCHIVE_BUCKET_NAME_2}" \
        --arg azure_archive_queue "${AZURE_ARCHIVE_QUEUE_NAME}" \
        '{
            "Namespace": $namespace,
            "subdomain": $subdomain,
            "DRSubdomain": $dr_subdomain,
            "KeycloakUsername": $keycloak_username,
            "KeycloakPassword": $keycloak_password,
            "KeycloakHost": $keycloak_host,
            "KeycloakRealm": $keycloak_realm,
            "KeycloakClientId": $keycloak_client_id,
            "AzureAccountName": $azure_account_name,
            "AzureAccountKey": $azure_account_key,
            "AzureArchiveContainer": $azure_archive_container,
            "AzureArchiveContainer2": $azure_archive_container2,
            "AzureArchiveQueue": $azure_archive_queue
        }')
fi

# Select test image and command based on test type
case "${TEST_TYPE}" in
    ctst)
        TEST_IMAGE="${E2E_CTST_IMAGE}"
        # CTST uses a custom command with world parameters
        TEST_COMMAND=("./run" "premerge" "${WORLD_PARAMETERS}" "--parallel" "${PARALLEL_RUNS}" "--retry" "${RETRIES}" "--retry-tag-filter" "@Flaky" "--format" "junit:${JUNIT_REPORT_PATH}")
        # Add any additional arguments passed to the script
        TEST_COMMAND+=("${ADDITIONAL_ARGS[@]}")
        ;;
    e2e)
        TEST_IMAGE="${E2E_IMAGE}" 
        TEST_COMMAND=("npm" "run" "test:e2e")
        ;;
    smoke)
        TEST_IMAGE="${E2E_IMAGE}"
        TEST_COMMAND=("npm" "run" "test:smoke")
        ;;
    *)
        echo "Error: Unknown test type '${TEST_TYPE}'"
        echo "Available types: ctst, e2e, smoke"
        exit 1
        ;;
esac

echo "Test Image: ${TEST_IMAGE}"
echo "Test Command: ${TEST_COMMAND[*]}"
echo

# Create the test Job
JOB_NAME="zenko-test-${TEST_TYPE}-$(date +%s)"
echo "Creating test job: ${JOB_NAME}..."

# Convert test command array to YAML format for kubectl
TEST_COMMAND_YAML=""
for cmd in "${TEST_COMMAND[@]}"; do
    TEST_COMMAND_YAML+="        - \"${cmd}\"\\n"
done

# Build the Job manifest based on test type
if [[ "${TEST_TYPE}" == "ctst" ]]; then
    cat <<EOF | kubectl --kubeconfig="${KUBECONFIG_FILE}" apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: ${JOB_NAME}
  namespace: ${NAMESPACE}
  labels:
    app: zenko-test
    test-type: ${TEST_TYPE}
    managed-by: local-script
spec:
  ttlSecondsAfterFinished: 600
  backoffLimit: 0
  activeDeadlineSeconds: ${JOB_TIMEOUT}
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: test
        image: ${TEST_IMAGE}
        command:
$(echo -e "${TEST_COMMAND_YAML}")
        env:
        - name: TARGET_VERSION
          value: "${VERSION:-unknown}"
        - name: SEED_KEYCLOAK_DEFAULT_ROLES
          value: "true"
        - name: AZURE_BLOB_URL
          value: "${AZURE_BACKEND_ENDPOINT}"
        - name: AZURE_QUEUE_URL
          value: "${AZURE_BACKEND_QUEUE_ENDPOINT}"
        - name: VERBOSE
          value: "1"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        volumeMounts:
        - name: cold-data
          mountPath: /cold-data
        - name: reports
          mountPath: /reports
      volumes:
      - name: cold-data
        persistentVolumeClaim:
          claimName: sorbet-data
      - name: reports
        hostPath:
          path: /data/reports
          type: DirectoryOrCreate
EOF
else
    # Regular e2e/smoke tests
    cat <<EOF | kubectl --kubeconfig="${KUBECONFIG_FILE}" apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: ${JOB_NAME}
  namespace: ${NAMESPACE}
  labels:
    app: zenko-test
    test-type: ${TEST_TYPE}
    managed-by: local-script
spec:
  ttlSecondsAfterFinished: 600
  backoffLimit: 0
  activeDeadlineSeconds: ${JOB_TIMEOUT}
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: test
        image: ${TEST_IMAGE}
        command:
$(echo -e "${TEST_COMMAND_YAML}")
        env:
        - name: NAMESPACE
          value: "${NAMESPACE}"
        - name: INSTANCE_ID
          value: "${INSTANCE_ID}"
        - name: SUBDOMAIN
          value: "${SUBDOMAIN}"
        - name: OIDC_REALM
          value: "${OIDC_REALM}"
        - name: OIDC_CLIENT_ID
          value: "${OIDC_CLIENT_ID}"
        - name: OIDC_USERNAME
          value: "${OIDC_USERNAME}"
        - name: OIDC_PASSWORD
          value: "${OIDC_PASSWORD}"
        - name: OIDC_ENDPOINT
          value: "${OIDC_ENDPOINT}"
        - name: MANAGEMENT_ENDPOINT
          value: "${MANAGEMENT_ENDPOINT}"
        - name: S3_ENDPOINT
          value: "${S3_ENDPOINT}"
        resources:
          requests:
            memory: "512Mi"
            cpu: "200m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        volumeMounts:
        - name: test-results
          mountPath: /tmp/test-results
      volumes:
      - name: test-results
        emptyDir: {}
EOF
fi

# Wait for test job completion
echo "Waiting for test job ${JOB_NAME} to complete (timeout: ${JOB_TIMEOUT}s)..."
if kubectl --kubeconfig="${KUBECONFIG_FILE}" wait --for=condition=complete "job/${JOB_NAME}" -n "${NAMESPACE}" --timeout="${JOB_TIMEOUT}s"; then
    echo
    echo "Tests completed successfully!"
    echo
    echo "Test results:"
    kubectl --kubeconfig="${KUBECONFIG_FILE}" logs "job/${JOB_NAME}" -n "${NAMESPACE}" || true
else
    echo
    echo "Test job failed or timed out. Getting logs..."
    kubectl --kubeconfig="${KUBECONFIG_FILE}" logs "job/${JOB_NAME}" -n "${NAMESPACE}" || true
    echo
    echo "Tests failed!"
    exit 1
fi