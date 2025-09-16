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

    echo "Deleting ClusterRoleBinding '${CLUSTER_ROLE_BINDING_NAME}'..."
    kubectl --kubeconfig="${KUBECONFIG_FILE}" delete clusterrolebinding "${CLUSTER_ROLE_BINDING_NAME}" --ignore-not-found=true

    echo "Deleting ClusterRole '${CLUSTER_ROLE_NAME}'..."
    kubectl --kubeconfig="${KUBECONFIG_FILE}" delete clusterrole "${CLUSTER_ROLE_NAME}" --ignore-not-found=true

    echo "Deleting ServiceAccount '${SERVICE_ACCOUNT_NAME}' in namespace '${NAMESPACE}'..."
    kubectl --kubeconfig="${KUBECONFIG_FILE}" delete serviceaccount "${SERVICE_ACCOUNT_NAME}" -n "${NAMESPACE}" --ignore-not-found=true

    echo "Deleting setup Jobs in namespace '${NAMESPACE}'..."
    kubectl --kubeconfig="${KUBECONFIG_FILE}" delete job -n "${NAMESPACE}" -l "managed-by=${MANAGED_BY_LABEL}" --ignore-not-found=true

    echo "Cleanup complete."
}

apply_rbac() {
    echo "Applying RBAC permissions..."
    cat <<EOF > rbac.yaml
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
- apiGroups: ["", "apps", "batch", "rbac.authorization.k8s.io", "zenko.io", "networking.k8s.io"]
  resources: ["*"]
  verbs: ["*"]
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
    cat rbac.yaml
    kubectl --kubeconfig="${KUBECONFIG_FILE}" apply -f rbac.yaml
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
    if [[ -n "${GIT_ACCESS_TOKEN:-}" ]]; then
        setup_args+=("--git-access-token" "${GIT_ACCESS_TOKEN}")
    fi
    setup_args+=("${additional_args_ref[@]}")
    
    local setup_args_yaml
    setup_args_yaml=$(array_to_yaml_list setup_args)

    echo "Creating setup job: ${job_name}..."
    echo "Setup container args: ${setup_args[*]}"

    cat <<EOF > job.yaml
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
    cat job.yaml
    kubectl --kubeconfig="${KUBECONFIG_FILE}" apply -f job.yaml

    echo "Waiting for job '${job_name}' to complete and streaming logs (timeout: ${JOB_TIMEOUT}s)..."
    kubectl --kubeconfig="${KUBECONFIG_FILE}" logs -f "job/${job_name}" -n "${NAMESPACE}" &
    
    if kubectl --kubeconfig="${KUBECONFIG_FILE}" wait --for=condition=complete "job/${job_name}" -n "${NAMESPACE}" --timeout="${JOB_TIMEOUT}s"; then
        echo "Setup completed successfully."
    else
        echo "Error: Setup job failed or timed out." >&2
        echo "--- Job Description ---"
        kubectl --kubeconfig="${KUBECONFIG_FILE}" describe "job/${job_name}" -n "${NAMESPACE}" || true
        echo "--- Pod Status ---"
        kubectl --kubeconfig="${KUBECONFIG_FILE}" get pods -l job-name="${job_name}" -n "${NAMESPACE}" -o wide || true
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
