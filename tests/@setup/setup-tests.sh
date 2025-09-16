#!/bin/bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-default}"
INSTANCE_ID="${INSTANCE_ID:-end2end}"
SUBDOMAIN="${SUBDOMAIN:-zenko.local}"
SETUP_IMAGE="${SETUP_IMAGE:-ghcr.io/scality/zenko-setup:latest}"
LOG_LEVEL="${LOG_LEVEL:-info}"
METADATA_NAMESPACE="${METADATA_NAMESPACE:-metadata}"
JOB_TIMEOUT="${JOB_TIMEOUT:-1800}"
KUBECONFIG_FILE="${KUBECONFIG_FILE:-${HOME}/.kube/config}"

SERVICE_ACCOUNT_NAME="zenko-setup"
CLUSTER_ROLE_NAME="zenko-setup-role"
CLUSTER_ROLE_BINDING_NAME="zenko-setup-binding"
MANAGED_BY_LABEL="zenko-setup-script"

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS] [-- ADDITIONAL_SETUP_ARGS]

Options:
  --kubeconfig <path>  Path to the kubeconfig file. Defaults to ~/.kube/config.
  --cleanup            Remove all resources created by this script and exit.
  --help               Display this help message and exit.

ADDITIONAL_SETUP_ARGS:
  Any arguments placed after '--' will be passed directly to the setup container.
EOF
    exit 1
}

check_deps() {
    command -v kubectl >/dev/null || { echo "Error: kubectl is not installed. Please install it to continue." >&2; exit 1; }
}

array_to_yaml_list() {
    local -n arr=$1
    for item in "${arr[@]}"; do
        echo "        - \"${item}\""
    done
}

cleanup() {
    echo "Starting cleanup of all resources managed by this script..."
    kubectl --kubeconfig="${KUBECONFIG_FILE}" delete clusterrolebinding "${CLUSTER_ROLE_BINDING_NAME}" --ignore-not-found=true
    kubectl --kubeconfig="${KUBECONFIG_FILE}" delete clusterrole "${CLUSTER_ROLE_NAME}" --ignore-not-found=true
    kubectl --kubeconfig="${KUBECONFIG_FILE}" delete serviceaccount "${SERVICE_ACCOUNT_NAME}" -n "${NAMESPACE}" --ignore-not-found=true
    kubectl --kubeconfig="${KUBECONFIG_FILE}" delete job -n "${NAMESPACE}" -l "managed-by=${MANAGED_BY_LABEL}" --ignore-not-found=true
    echo "Cleanup complete."
}

apply_rbac() {
    echo "Applying minimal bootstrap RBAC permissions..."
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
- apiGroups: [""]
  resources: ["namespaces", "services", "secrets", "serviceaccounts", "configmaps"]
  verbs: ["*"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "create", "update", "patch"]
- apiGroups: ["rbac.authorization.k8s.io"]
  resources: ["clusterroles", "clusterrolebindings"]
  verbs: ["*"]
- apiGroups: ["zenko.io"]
  resources: ["*"]
  verbs: ["get"]
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

show_failure_details() {
    local job_name="$1"
    echo "Job Description"
    kubectl --kubeconfig="${KUBECONFIG_FILE}" describe "job/${job_name}" -n "${NAMESPACE}" || true
    echo "Pod Status"
    kubectl --kubeconfig="${KUBECONFIG_FILE}" get pods -l job-name="${job_name}" -n "${NAMESPACE}" -o wide || true
    echo "Pod Logs (last 100 lines)"
    kubectl --kubeconfig="${KUBECONFIG_FILE}" logs -l job-name="${job_name}" -n "${NAMESPACE}" --tail=100 || true
}

monitor_job_and_stream_logs() {
    local job_name="$1"
    local timeout="$2"
    
    echo "Waiting for job '${job_name}' to start... (timeout: ${timeout}s)"

    local pod_name=""
    local pod_find_start_time=$(date +%s)
    while [[ -z "$pod_name" ]]; do
        if (( $(date +%s) - pod_find_start_time > 60 )); then
            echo "Error: Timed out waiting for pod to be created for job ${job_name}" >&2
            return 1
        fi
        pod_name=$(kubectl --kubeconfig="${KUBECONFIG_FILE}" get pods -l "job-name=${job_name}" -n "${NAMESPACE}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
        sleep 2
    done

    echo "Pod '${pod_name}' found. Waiting for it to become ready..."
    if ! kubectl --kubeconfig="${KUBECONFIG_FILE}" wait --for=condition=Ready "pod/${pod_name}" -n "${NAMESPACE}" --timeout=120s; then
        echo "Error: Pod '${pod_name}' did not become ready in time." >&2
        return 1
    fi

    echo "Streaming logs from pod: ${pod_name}"
    kubectl --kubeconfig="${KUBECONFIG_FILE}" logs -f "${pod_name}" -c "setup" -n "${NAMESPACE}" &
    local log_pid=$!

    trap "kill ${log_pid} 2>/dev/null || true" RETURN

    local start_time=$(date +%s)
    while true; do
        local current_time=$(date +%s)
        if (( current_time - start_time > timeout )); then
            echo "Error: Setup job '${job_name}' timed out after ${timeout} seconds!" >&2
            return 1
        fi

        local succeeded=$(kubectl --kubeconfig="${KUBECONFIG_FILE}" get job "${job_name}" -n "${NAMESPACE}" -o jsonpath='{.status.succeeded}' 2>/dev/null || echo "0")
        if [[ "$succeeded" -ge 1 ]]; then
            echo "Setup job '${job_name}' completed successfully."
            sleep 2
            return 0
        fi

        local failed=$(kubectl --kubeconfig="${KUBECONFIG_FILE}" get job "${job_name}" -n "${NAMESPACE}" -o jsonpath='{.status.failed}' 2>/dev/null || echo "0")
        if [[ "$failed" -ge 1 ]]; then
            echo "Error: Setup job '${job_name}' failed!" >&2
            sleep 2
            return 1
        fi

        sleep 5
    done
}

create_job() {
    local -n additional_args_ref=$1
    local job_name="zenko-setup-$(date +%s)"

    local -a setup_args
    setup_args=(
        "all"
        "--namespace" "${NAMESPACE}"
        "--subdomain" "${SUBDOMAIN}"
        "--instance-id" "${INSTANCE_ID}"
        "--metadata-namespace" "${METADATA_NAMESPACE}"
    )
    [[ -n "${GIT_ACCESS_TOKEN:-}" ]] && setup_args+=("--git-access-token" "${GIT_ACCESS_TOKEN}")
    setup_args+=("${additional_args_ref[@]}")
    
    local setup_args_yaml
    setup_args_yaml=$(array_to_yaml_list setup_args)

    echo "Creating setup job: ${job_name}..."
    echo "Setup container args: ${setup_args[*]}"

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
  backoffLimit: 1
  activeDeadlineSeconds: ${JOB_TIMEOUT}
  template:
    spec:
      serviceAccountName: ${SERVICE_ACCOUNT_NAME}
      restartPolicy: Never
      containers:
      - name: setup
        image: ${SETUP_IMAGE}
        args:
${setup_args_yaml}
        env:
        - name: LOG_LEVEL
          value: "${LOG_LEVEL}"
        - name: GIT_ACCESS_TOKEN
          value: "${GIT_ACCESS_TOKEN:-}"
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "1Gi"
            cpu: "500m"
EOF
    
    if ! monitor_job_and_stream_logs "${job_name}" "${JOB_TIMEOUT}"; then
        show_failure_details "${job_name}"
        exit 1
    fi
}

main() {
    ACTION="run"
    ADDITIONAL_ARGS=()

    while [[ $# -gt 0 ]]; do
        case $1 in
            --kubeconfig)
                KUBECONFIG_FILE="$2"
                shift 2
                ;;
            --cleanup)
                ACTION="cleanup"
                shift 1
                ;;
            --help)
                usage
                ;;
            --)
                shift
                ADDITIONAL_ARGS=("$@")
                break
                ;;
            *)
                echo "Error: Unknown option: $1" >&2
                usage
                ;;
        esac
    done

    check_deps

    if [[ "${ACTION}" == "cleanup" ]]; then
        cleanup
        exit 0
    fi
    
    echo "Starting Zenko test environment setup..."
    echo "Using kubeconfig: ${KUBECONFIG_FILE}"

    cleanup
    
    apply_rbac
    create_job ADDITIONAL_ARGS
    
    echo "Zenko test environment is ready."
}

main "$@"
