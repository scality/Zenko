#!/bin/bash
set -exu

# Usage: ./run.sh <tag>  (e.g., ./run.sh Yoyoyo or ./run.sh PreMerge)

CUCUMBER_TAG="${1#@}"
WORLD_PARAMETERS='{"subdomain":"zenko","ssl":false,"port":"80","AccountName":"zenko","AccountAccessKey":"accessKey1","AccountSecretKey":"secretKey1"}'

# Create pod only if it doesn't exist
if ! kubectl get pod ctst-end2end &>/dev/null; then
    kubectl run ctst-end2end \
            --pod-running-timeout=5m \
            --image="ghcr.io/scality/zenko/zenko-e2e-ctst:latest" \
            --restart=Never \
            --image-pull-policy=IfNotPresent \
            --command -- sleep infinity
    kubectl wait --for=condition=Ready pod/ctst-end2end --timeout=5m
fi

# Copy local test files so that the changes you want to test are included in the test run
kubectl exec ctst-end2end -- rm -rf /ctst/features /ctst/common /ctst/steps /ctst/world
kubectl cp ./features ctst-end2end:/ctst/features
kubectl cp ./common ctst-end2end:/ctst/common
kubectl cp ./steps ctst-end2end:/ctst/steps
kubectl cp ./world ctst-end2end:/ctst/world

kubectl exec -it ctst-end2end -- ./run base $WORLD_PARAMETERS --tags "@$CUCUMBER_TAG"