#!/bin/bash
set -exu

# Usage: ./run-ctst-locally.sh <tags> [image]
# Examples:
#   ./run-ctst-locally.sh @getObject                       # Uses default GHCR image
#   ./run-ctst-locally.sh @getObject ctst-image:local      # Uses local image
#   ./run-ctst-locally.sh "@PreMerge and not @Flaky"       # Complex tag expression (quotes needed)

CUCUMBER_TAGS="$1"
IMAGE_NAME="${2:-ghcr.io/scality/zenko/zenko-e2e-ctst:ctst_codespace_setup}"

# Load unified test configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../../.github/scripts/end2end/load-config.sh" ctst

# Version is used with a Before Hook (in ctst/common/hooks.ts) to skip 
# certain tests based on their @version tag.
VERSION=$(cat ../../VERSION | grep -Po 'VERSION="\K[^"]*')
POD_NAME="ctst-end2end"


# Create the pod if it doesn't exist
if ! kubectl get pod "$POD_NAME" &>/dev/null; then
    echo "Loading image into kind cluster, can take 1~3 minutes"
    kind load docker-image "$IMAGE_NAME" --name kind || true
    
    kubectl run "$POD_NAME" \
            --pod-running-timeout=5m \
            --image="$IMAGE_NAME" \
            --restart=Never \
            --image-pull-policy=Never \
            --command -- sleep infinity
    kubectl wait --for=condition=Ready pod/"$POD_NAME" --timeout=5m
fi

# Grant cluster-admin role to service accounts to ensure the test pod has permissions
# to run some kubernetes commands (we have a k8s client inside the test creating pods, jobs, etc.)
kubectl create clusterrolebinding serviceaccounts-cluster-admin \
  --clusterrole=cluster-admin \
  --group=system:serviceaccounts 2>/dev/null || true

# Copy local test files so that ongoing changes are included in the local test
kubectl exec "$POD_NAME" -- rm -rf /ctst/features /ctst/common /ctst/steps /ctst/world
kubectl cp ./features "$POD_NAME":/ctst/features
kubectl cp ./common "$POD_NAME":/ctst/common
kubectl cp ./steps "$POD_NAME":/ctst/steps
kubectl cp ./world "$POD_NAME":/ctst/world

kubectl cp ./tsconfig.json "$POD_NAME":/ctst/tsconfig.json
kubectl cp ./cucumber.config.cjs "$POD_NAME":/ctst/cucumber.config.cjs

# Run tests using standard cucumber-js syntax
kubectl exec "$POD_NAME" -- env \
    TARGET_VERSION="$VERSION" \
    $(env_for_kubectl_exec) \
    yarn cucumber-js \
        --config cucumber.config.cjs \
        --parallel 1 \
        --tags "$CUCUMBER_TAGS" \
        --exit
