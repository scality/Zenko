#!/bin/bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-default}"
ZENKO_NAME="${ZENKO_NAME:-end2end}"
SUBDOMAIN="${SUBDOMAIN:-zenko.local}"
SETUP_IMAGE="${SETUP_IMAGE:-ghcr.io/scality/zenko-setup:latest}"
METADATA_NAMESPACE="${METADATA_NAMESPACE:-metadata}"
JOB_TIMEOUT="${JOB_TIMEOUT:-1800}"
KUBECONFIG_FILE="${KUBECONFIG_FILE:-${HOME}/.kube/config}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOLUTION_DIR="${SCRIPT_DIR}/../../solution"
SERVICE_ACCOUNT_NAME="zenko-setup"
CLUSTER_ROLE_NAME="zenko-setup-role"
CLUSTER_ROLE_BINDING_NAME="zenko-setup-binding"
MANAGED_BY_LABEL="zenko-setup-script"

# Display usage information
usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS] [-- ADDITIONAL_SETUP_ARGS]

Bootstrap a Zenko test environment using a Kubernetes Job.

Options:
  --kubeconfig <path>  Path to the kubeconfig file. Defaults to ~/.kube/config.
  --cleanup            Remove all resources created by this script and exit.
  --help               Display this help message and exit.

ADDITIONAL_SETUP_ARGS:
  Any arguments placed after '--' are passed directly to the setup container.
  If no args are provided, the default command 'all' is used.
EOF
    exit 1
}

# Check for required command-line tools
check_deps() {
    command -v kubectl >/dev/null || { echo "Error: kubectl is not installed." >&2; exit 1; }
    command -v yq >/dev/null || { echo "Error: yq is not installed." >&2; exit 1; }
}

# Remove all Kubernetes resources created by this script
cleanup() {
    echo "Cleaning up resources managed by this script..."
    kubectl --kubeconfig="${KUBECONFIG_FILE}" delete clusterrolebinding "${CLUSTER_ROLE_BINDING_NAME}" --ignore-not-found=true
    kubectl --kubeconfig="${KUBECONFIG_FILE}" delete clusterrole "${CLUSTER_ROLE_NAME}" --ignore-not-found=true
    kubectl --kubeconfig="${KUBECONFIG_FILE}" delete serviceaccount "${SERVICE_ACCOUNT_NAME}" -n "${NAMESPACE}" --ignore-not-found=true
    kubectl --kubeconfig="${KUBECONFIG_FILE}" delete job -n "${NAMESPACE}" -l "managed-by=${MANAGED_BY_LABEL}" --ignore-not-found=true
    echo "Cleanup complete."
}

# Simple RBAC for the setup job
apply_rbac() {
    echo "Applying RBAC permissions..."
    cat <<EOF | kubectl --kubeconfig="${KUBECONFIG_FILE}" apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${SERVICE_ACCOUNT_NAME}
  namespace: ${NAMESPACE}
  labels:
    managed-by: ${MANAGED_BY_LABEL}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: ${CLUSTER_ROLE_NAME}
  labels:
    managed-by: ${MANAGED_BY_LABEL}
rules:
- apiGroups: ["", "apps", "rbac.authorization.k8s.io", "zenko.io"]
  resources: ["*"]
  verbs: ["*"]
- apiGroups: ["apiextensions.k8s.io"]
  resources: ["customresourcedefinitions"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ${CLUSTER_ROLE_BINDING_NAME}
  labels:
    managed-by: ${MANAGED_BY_LABEL}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: ${CLUSTER_ROLE_NAME}
subjects:
- kind: ServiceAccount
  name: ${SERVICE_ACCOUNT_NAME}
  namespace: ${NAMESPACE}
EOF
}

run_setup_job() {
    local -n additional_args_ref=$1
    local job_name="zenko-setup-$(date +%s)"

    local kafka_image
    kafka_image="$(cd "${SOLUTION_DIR}" && yq eval '.kafka | (.sourceRegistry // "docker.io") + "/" + .image' deps.yaml)"
    local kafka_tag
    kafka_tag="$(cd "${SOLUTION_DIR}" && yq eval '.kafka.tag' deps.yaml)"

    local -a setup_args
    if [[ ${#additional_args_ref[@]} -gt 0 ]]; then
        setup_args=("${additional_args_ref[@]}")
    else
        setup_args=("all")
    fi

    setup_args+=(
        "--namespace" "${NAMESPACE}"
        "--subdomain" "${SUBDOMAIN}"
        "--zenko-name" "${ZENKO_NAME}"
        "--metadata-namespace" "${METADATA_NAMESPACE}"
    )
    [[ -n "${GIT_ACCESS_TOKEN:-}" ]] && setup_args+=("--git-access-token" "${GIT_ACCESS_TOKEN}")

    echo "Creating setup job '${job_name}'..."
    echo "Container args: ${setup_args[*]}"

    cat <<EOF | kubectl --kubeconfig="${KUBECONFIG_FILE}" apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: ${job_name}
  namespace: ${NAMESPACE}
  labels:
    app: zenko-setup
    managed-by: ${MANAGED_BY_LABEL}
spec:
  ttlSecondsAfterFinished: 300
  backoffLimit: 3
  activeDeadlineSeconds: ${JOB_TIMEOUT}
  template:
    spec:
      serviceAccountName: ${SERVICE_ACCOUNT_NAME}
      restartPolicy: Never
      containers:
      - name: setup
        image: ${SETUP_IMAGE}
        imagePullPolicy: Always
        args:
$(for arg in "${setup_args[@]}"; do echo "        - \"${arg}\""; done)
        env:
        - name: KAFKA_IMAGE
          value: "${kafka_image}"
        - name: KAFKA_TAG
          value: "${kafka_tag}"
        - name: GIT_ACCESS_TOKEN
          value: "${GIT_ACCESS_TOKEN}"
        - name: GCP_ACCESS_KEY
          value: "${GCP_ACCESS_KEY}"
        - name: GCP_SECRET_KEY
          value: "${GCP_SECRET_KEY}"
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
        - name: AWS_BACKEND_SOURCE_LOCATION
          value: "${AWS_BACKEND_SOURCE_LOCATION}"
        - name: AWS_BACKEND_DESTINATION_LOCATION
          value: "${AWS_BACKEND_DESTINATION_LOCATION}"
        - name: AWS_BACKEND_DESTINATION_FAIL_LOCATION
          value: "${AWS_BACKEND_DESTINATION_FAIL_LOCATION}"
        - name: AWS_BACKEND_DESTINATION_REPLICATION_FAIL_CTST_LOCATION
          value: "${AWS_BACKEND_DESTINATION_REPLICATION_FAIL_CTST_LOCATION:-}"
        - name: AWS_BUCKET_NAME
          value: "${AWS_BUCKET_NAME}"
        - name: AWS_CRR_BUCKET_NAME
          value: "${AWS_CRR_BUCKET_NAME}"
        - name: AWS_FAIL_BUCKET_NAME
          value: "${AWS_FAIL_BUCKET_NAME}"
        - name: AWS_REPLICATION_FAIL_CTST_BUCKET_NAME
          value: "${AWS_REPLICATION_FAIL_CTST_BUCKET_NAME:-}"
        - name: AWS_ENDPOINT
          value: "${AWS_ENDPOINT}"
        - name: AWS_ACCESS_KEY
          value: "${AWS_ACCESS_KEY}"
        - name: AWS_SECRET_KEY
          value: "${AWS_SECRET_KEY}"
        - name: AZURE_BACKEND_DESTINATION_LOCATION
          value: "${AZURE_BACKEND_DESTINATION_LOCATION}"
        - name: AZURE_ARCHIVE_BACKEND_DESTINATION_LOCATION
          value: "${AZURE_ARCHIVE_BACKEND_DESTINATION_LOCATION}"
        - name: AZURE_BACKEND_ENDPOINT
          value: "${AZURE_BACKEND_ENDPOINT}"
        - name: AZURE_BACKEND_QUEUE_ENDPOINT
          value: "${AZURE_BACKEND_QUEUE_ENDPOINT}"
        - name: AZURE_ARCHIVE_BUCKET_NAME
          value: "${AZURE_ARCHIVE_BUCKET_NAME}"
        - name: AZURE_ARCHIVE_BUCKET_NAME_2
          value: "${AZURE_ARCHIVE_BUCKET_NAME_2}"
        - name: AZURE_CRR_BUCKET_NAME
          value: "${AZURE_CRR_BUCKET_NAME}"
        - name: AZURE_ACCOUNT_NAME
          value: "${AZURE_ACCOUNT_NAME}"
        - name: AZURE_SECRET_KEY
          value: "${AZURE_SECRET_KEY}"
        - name: GCP_BACKEND_DESTINATION_LOCATION
          value: "${GCP_BACKEND_DESTINATION_LOCATION}"
        - name: GCP_CRR_BUCKET_NAME
          value: "${GCP_CRR_BUCKET_NAME}"
        - name: GCP_CRR_MPU_BUCKET_NAME
          value: "${GCP_CRR_MPU_BUCKET_NAME}"
        - name: COLD_BACKEND_DESTINATION_LOCATION
          value: "${COLD_BACKEND_DESTINATION_LOCATION}"
        - name: MIRIA_BACKEND_DESTINATION_LOCATION
          value: "${MIRIA_BACKEND_DESTINATION_LOCATION}"
        - name: NOTIF_DEST_NAME
          value: "${NOTIF_DEST_NAME}"
        - name: NOTIF_DEST_TOPIC
          value: "${NOTIF_DEST_TOPIC}"
        - name: NOTIF_ALT_DEST_NAME
          value: "${NOTIF_ALT_DEST_NAME}"
        - name: NOTIF_ALT_DEST_TOPIC
          value: "${NOTIF_ALT_DEST_TOPIC}"
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "1Gi"
            cpu: "500m"
EOF

    echo "Waiting for pod to be created by job..."
    local pod_name=""
    for _ in $(seq 1 60); do
        pod_name=$(kubectl --kubeconfig="${KUBECONFIG_FILE}" get pods -l "job-name=${job_name}" -n "${NAMESPACE}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
        if [[ -n "${pod_name}" ]]; then
            break
        fi
        sleep 1
    done

    if [[ -z "${pod_name}" ]]; then
        echo "Error: Pod for job '${job_name}' was not created in time." >&2
        kubectl --kubeconfig="${KUBECONFIG_FILE}" describe "job/${job_name}" -n "${NAMESPACE}"
        exit 1
    fi
    echo "Found pod '${pod_name}'."

    echo "Waiting for pod to become ready..."
    if ! kubectl --kubeconfig="${KUBECONFIG_FILE}" wait "pod/${pod_name}" -n "${NAMESPACE}" --for=condition=Ready --timeout=300s; then
        echo "Error: Pod '${pod_name}' did not become ready." >&2
        kubectl --kubeconfig="${KUBECONFIG_FILE}" describe "pod/${pod_name}" -n "${NAMESPACE}"
        exit 1
    fi

    echo "Pod is ready. Streaming logs..."
    kubectl --kubeconfig="${KUBECONFIG_FILE}" logs -f "${pod_name}" -n "${NAMESPACE}"

    echo "Log stream finished. Waiting for job to complete..."
    if kubectl --kubeconfig="${KUBECONFIG_FILE}" wait "job/${job_name}" -n "${NAMESPACE}" --for=condition=Complete --timeout=60s 2>/dev/null; then
        echo "Job '${job_name}' completed successfully."
    elif kubectl --kubeconfig="${KUBECONFIG_FILE}" wait "job/${job_name}" -n "${NAMESPACE}" --for=condition=Failed --timeout=5s 2>/dev/null; then
        echo "Error: Job '${job_name}' failed." >&2
        kubectl --kubeconfig="${KUBECONFIG_FILE}" describe "pod/${pod_name}" -n "${NAMESPACE}"
        exit 1
    else
        echo "Error: Job '${job_name}' did not complete in time." >&2
        kubectl --kubeconfig="${KUBECONFIG_FILE}" describe "job/${job_name}" -n "${NAMESPACE}"
        exit 1
    fi
}

main() {
    local action="run"
    local additional_args=()

    while [[ $# -gt 0 ]]; do
        case $1 in
            --kubeconfig) KUBECONFIG_FILE="$2"; shift 2 ;;
            --cleanup) action="cleanup"; shift 1 ;;
            --help) usage ;;
            --) shift; additional_args=("$@"); break ;;
            *) echo "Error: Unknown option: $1" >&2; usage ;;
        esac
    done

    check_deps

    if [[ "${action}" == "cleanup" ]]; then
        cleanup
        exit 0
    fi

    echo "Starting Zenko test environment setup..."
    echo "Using kubeconfig: ${KUBECONFIG_FILE}"

    cleanup

    apply_rbac
    run_setup_job additional_args

    echo "Zenko test environment is ready."
}

main "$@"
