#!/bin/bash
set -exu

# Simple test script to verify env_for_run() works with kubectl run

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source the config loader
source "${SCRIPT_DIR}/../../.github/scripts/end2end/load-config.sh" ctst

# Run a persistent pod that prints environment variables and sleeps
kubectl run test-env-pod \
    --image=busybox \
    --restart=Never \
    $(env_for_kubectl_run) \
    -- sh -c 'echo "=== Environment Variables from load-config.sh ===" && env | grep -E "SUBDOMAIN|ACCOUNT_NAME|AWS_|KAFKA_|KEYCLOAK_|NOTIF_" | sort && echo "Pod will sleep for 1 hour. Use: kubectl exec -it test-env-pod -- sh" && sleep 3600'

echo ""
echo "Pod created! Connect to it with:"
echo "  kubectl exec -it test-env-pod -- sh"
echo ""
echo "Delete it with:"
echo "  kubectl delete pod test-env-pod"
