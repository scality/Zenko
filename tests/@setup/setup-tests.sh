#!/bin/bash
set -euox pipefail

# Simple script to setup test environment on any Zenko cluster
# Usage: ./setup-tests.sh [path-to-kubeconfig] [additional-options]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KUBECONFIG_FILE="${1:-$HOME/.kube/config}"
shift || true  # Remove first argument, keep rest as additional options

# Default environment variables - modify these as needed
export NAMESPACE="${NAMESPACE:-default}"
export INSTANCE_ID="${INSTANCE_ID:-end2end}"
export SUBDOMAIN="${SUBDOMAIN:-zenko.local}"
export SETUP_IMAGE="${SETUP_IMAGE:-ghcr.io/scality/zenko-setup:latest}"
export LOG_LEVEL="${LOG_LEVEL:-info}"
export METADATA_NAMESPACE="${METADATA_NAMESPACE:-metadata}"
export JOB_TIMEOUT="${JOB_TIMEOUT:-1800}"

# Optional environment variables (set them before running this script if needed)
# export GIT_ACCESS_TOKEN="your-token-here"

echo "=== Zenko Test Environment Setup ==="
echo "Kubeconfig: ${KUBECONFIG_FILE}"
echo "Namespace: ${NAMESPACE}"
echo "Instance ID: ${INSTANCE_ID}"
echo "Subdomain: ${SUBDOMAIN}"
echo "Setup Image: ${SETUP_IMAGE}"
echo "Additional options: $*"
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
    echo "Please check your kubeconfig file: ${KUBECONFIG_FILE}"
    exit 1
fi
echo "Connected to cluster"

# Setup RBAC if needed
echo "Setting up RBAC permissions..."
cat <<EOF | kubectl --kubeconfig="${KUBECONFIG_FILE}" apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: zenko-setup
  namespace: ${NAMESPACE}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: zenko-setup
rules:
# Core API permissions
- apiGroups: [""]
  resources: ["*"]
  verbs: ["*"]
# Apps API permissions  
- apiGroups: ["apps"]
  resources: ["*"]
  verbs: ["*"]
# Batch API permissions
- apiGroups: ["batch"]
  resources: ["*"]
  verbs: ["*"]
# RBAC permissions
- apiGroups: ["rbac.authorization.k8s.io"]
  resources: ["*"]
  verbs: ["*"]
# Custom resources (Zenko CRDs)
- apiGroups: ["zenko.io"]
  resources: ["*"]
  verbs: ["*"]
# Networking
- apiGroups: ["networking.k8s.io"]
  resources: ["*"]
  verbs: ["*"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: zenko-setup
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: zenko-setup
subjects:
- kind: ServiceAccount
  name: zenko-setup
  namespace: ${NAMESPACE}
EOF

# Build the setup command arguments
SETUP_ARGS=("all")
SETUP_ARGS+=("--namespace" "${NAMESPACE}")
SETUP_ARGS+=("--subdomain" "${SUBDOMAIN}")

# Add instance ID if provided
if [[ -n "${INSTANCE_ID}" ]]; then
    SETUP_ARGS+=("--instance-id" "${INSTANCE_ID}")
fi

# Add git access token if provided
if [[ -n "${GIT_ACCESS_TOKEN:-}" ]]; then
    SETUP_ARGS+=("--git-access-token" "${GIT_ACCESS_TOKEN}")
fi

# Add metadata namespace
SETUP_ARGS+=("--metadata-namespace" "${METADATA_NAMESPACE}")

# Add any additional command line arguments passed to this script
SETUP_ARGS+=("$@")

# Convert args array to YAML format for kubectl
SETUP_ARGS_YAML=""
for arg in "${SETUP_ARGS[@]}"; do
    SETUP_ARGS_YAML+="        - \"${arg}\"
"
done

# Create the Job
JOB_NAME="zenko-setup-$(date +%s)"
echo "Creating setup job: ${JOB_NAME}..."
echo "Setup args: ${SETUP_ARGS[*]}"

cat <<EOF | kubectl --kubeconfig="${KUBECONFIG_FILE}" apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: ${JOB_NAME}
  namespace: ${NAMESPACE}
  labels:
    app: zenko-setup
    managed-by: local-script
spec:
  ttlSecondsAfterFinished: 300
  backoffLimit: 1
  activeDeadlineSeconds: ${JOB_TIMEOUT}
  template:
    spec:
      serviceAccountName: zenko-setup
      restartPolicy: Never
      containers:
      - name: setup
        image: ${SETUP_IMAGE}
        args:
${SETUP_ARGS_YAML}
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

# Wait for job completion
echo "Waiting for job ${JOB_NAME} to complete (timeout: ${JOB_TIMEOUT}s)..."
if kubectl --kubeconfig="${KUBECONFIG_FILE}" wait --for=condition=complete "job/${JOB_NAME}" -n "${NAMESPACE}" --timeout="${JOB_TIMEOUT}s"; then
    echo
    echo "Setup completed successfully!"
    echo
    echo "Your Zenko test environment is ready."
    echo "You can now run tests with: ./run-tests.sh ${KUBECONFIG_FILE}"
    echo
    
    # Show logs for debugging even on success
    echo "Setup job logs:"
    kubectl --kubeconfig="${KUBECONFIG_FILE}" logs "job/${JOB_NAME}" -n "${NAMESPACE}" --tail=50 || true
    echo
else
    echo
    echo "Setup job failed or timed out!"
    echo
    
    # Get detailed job status
    echo "Job status:"
    kubectl --kubeconfig="${KUBECONFIG_FILE}" describe "job/${JOB_NAME}" -n "${NAMESPACE}" || true
    echo
    
    # Get pod status and logs
    echo "Pod status:"
    kubectl --kubeconfig="${KUBECONFIG_FILE}" get pods -l job-name="${JOB_NAME}" -n "${NAMESPACE}" -o wide || true
    echo
    
    echo "Setup job logs:"
    kubectl --kubeconfig="${KUBECONFIG_FILE}" logs "job/${JOB_NAME}" -n "${NAMESPACE}" || true
    echo
    
    echo "Setup failed!"
    exit 1
fi