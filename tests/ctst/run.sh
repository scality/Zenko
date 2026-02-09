#!/bin/bash
set -exu

# Usage: ./run.sh <tag>  (e.g., ./run.sh Yoyoyo or ./run.sh PreMerge)

CUCUMBER_TAG="${1#@}"
# Version is used with a @Before tags (in cli-testing repo) to skip certain tests.
VERSION=$(cat ../../VERSION | grep -Po 'VERSION="\K[^"]*')

WORLD_PARAMETERS="$(jq -c <<EOF
{
  "subdomain": "zenko.local",
  "ssl": false,
  "port": "80",
  "AccountName": "zenko",
  "AdminAccessKey": "ZNYO52SR80XW1S0VK6IL",
  "AdminSecretKey": "Hrk=4qCMpRqL2r4LmgUyfVPLj=PlImnms=FKtwJq"
}
EOF
)"

EMPTY_WORLD_PARAMETERS="{}"

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

# Grant cluster-admin role to service accounts to ensure the test pod has permissions
# to run some kubernetes commands (we have a k8s client inside the test creating pods, jobs, etc.)
kubectl create clusterrolebinding serviceaccounts-cluster-admin \
  --clusterrole=cluster-admin \
  --group=system:serviceaccounts 2>/dev/null || true

# Copy local test files so that the changes you want to test are included in the test run
kubectl exec ctst-end2end -- rm -rf /ctst/features /ctst/common /ctst/steps /ctst/world
kubectl cp ./features ctst-end2end:/ctst/features
kubectl cp ./common ctst-end2end:/ctst/common
kubectl cp ./steps ctst-end2end:/ctst/steps
kubectl cp ./world ctst-end2end:/ctst/world

kubectl exec -it ctst-end2end -- env TARGET_VERSION=$VERSION ./run base $WORLD_PARAMETERS --tags "@$CUCUMBER_TAG"