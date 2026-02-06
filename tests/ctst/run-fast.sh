#!/bin/bash
set -exu

# Like run.sh but copies local test files first
# Usage: ./run-fast.sh <tag>

TAG="${1:-PreMerge}"
TAG="${TAG#@}"

kubectl delete pod ctst-end2end --ignore-not-found --wait

# Start pod with sleep so we can copy files
kubectl run ctst-end2end \
    --image=$E2E_IMAGE \
    --restart=Never \
    --image-pull-policy=IfNotPresent \
    --env="CTST_FILTER_TAGS=$TAG" \
    --env="SDK=true" \
    --command -- sleep infinity

kubectl wait --for=condition=Ready pod/ctst-end2end --timeout=5m

# Copy local test files
kubectl cp ./features ctst-end2end:/ctst/features
kubectl cp ./common ctst-end2end:/ctst/common
kubectl cp ./steps ctst-end2end:/ctst/steps
kubectl cp ./world ctst-end2end:/ctst/world

# Run tests
kubectl exec -it ctst-end2end -- ./run tags

# Cleanup
kubectl delete pod ctst-end2end --ignore-not-found
