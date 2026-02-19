#!/bin/bash

# Script to run mocha node tests from a GitHub Codespace
# Uses a persistent pod with kubectl cp to sync local changes
#
# Usage: ./run-node-tests-locally.sh <test-grep> <test-path> [image]
#
# Examples:
#   ./run-node-tests-locally.sh "should list objects" "cloudserver/bucketGetV2"
#   ./run-node-tests-locally.sh "should list objects" "cloudserver" my-e2e:local
#   ./run-node-tests-locally.sh "" "smoke_tests"                    # Run all smoke tests
#   ./run-node-tests-locally.sh "" "cloudserver"                    # Run all cloudserver tests
#
# If you need to use a different image, delete pod first:
#   kubectl delete pod node-tests-local

set -ex

ZENKO_NAME=${ZENKO_NAME:-end2end}
IMAGE_NAME="${3:-ghcr.io/scality/zenko/zenko-e2e-ctst:ctst_codespace_setup}"
POD_NAME="node-tests-local"

TEST_GREP="${1:-should list objects in V2 format}"
TEST_PATH="${2:-cloudserver}"

ZENKO_ACCESS_KEY=$(kubectl get secret end2end-management-account-creds.v1 -o jsonpath='{.data.accessKey}' | base64 -d)
ZENKO_SECRET_KEY=$(kubectl get secret end2end-management-account-creds.v1 -o jsonpath='{.data.secretKey}' | base64 -d)

CLOUDSERVER_ENDPOINT="http://${ZENKO_NAME}-connector-s3api.default.svc.cluster.local:80"
VAULT_ENDPOINT="http://${ZENKO_NAME}-management-vault-iam-admin-api:80"
VAULT_STS_ENDPOINT="http://${ZENKO_NAME}-connector-vault-sts-api:80"
BACKBEAT_API_ENDPOINT="http://${ZENKO_NAME}-management-backbeat-api.default.svc.cluster.local:80"

# Path inside the zenko-e2e container
CONTAINER_PATH="/usr/local/bin/tests/node_tests"

if ! kubectl get pod "$POD_NAME" &>/dev/null; then
    echo "Loading image into kind cluster, can take 1~3 minutes"
    kind load docker-image "$IMAGE_NAME" --name kind || true
    
    kubectl run "$POD_NAME" \
        --image="$IMAGE_NAME" \
        --restart=Never \
        --image-pull-policy=IfNotPresent \
        --command -- sleep infinity
    kubectl wait --for=condition=Ready pod/"$POD_NAME" --timeout=5m
fi

# Copy local test files so that ongoing changes are included
kubectl exec "$POD_NAME" -- rm -rf "$CONTAINER_PATH"/cloudserver "$CONTAINER_PATH"/backbeat "$CONTAINER_PATH"/smoke_tests "$CONTAINER_PATH"/iam_policies "$CONTAINER_PATH"/utils
kubectl cp ./cloudserver "$POD_NAME":"$CONTAINER_PATH"/cloudserver
kubectl cp ./backbeat "$POD_NAME":"$CONTAINER_PATH"/backbeat
kubectl cp ./smoke_tests "$POD_NAME":"$CONTAINER_PATH"/smoke_tests
kubectl cp ./iam_policies "$POD_NAME":"$CONTAINER_PATH"/iam_policies
kubectl cp ./utils "$POD_NAME":"$CONTAINER_PATH"/utils
kubectl cp ./s3SDK.js "$POD_NAME":"$CONTAINER_PATH"/s3SDK.js
kubectl cp ./stsSDK.js "$POD_NAME":"$CONTAINER_PATH"/stsSDK.js
kubectl cp ./VaultClient.js "$POD_NAME":"$CONTAINER_PATH"/VaultClient.js
kubectl cp ./init_test.js "$POD_NAME":"$CONTAINER_PATH"/init_test.js

kubectl exec "$POD_NAME" -- env \
    ZENKO_ACCESS_KEY="$ZENKO_ACCESS_KEY" \
    ZENKO_SECRET_KEY="$ZENKO_SECRET_KEY" \
    CLOUDSERVER_ENDPOINT="$CLOUDSERVER_ENDPOINT" \
    VAULT_ENDPOINT="$VAULT_ENDPOINT" \
    VAULT_STS_ENDPOINT="$VAULT_STS_ENDPOINT" \
    BACKBEAT_API_ENDPOINT="$BACKBEAT_API_ENDPOINT" \
    sh -c "cd $CONTAINER_PATH && \
        npx mocha \
            --exit \
            --timeout 10000 \
            --recursive \
            --grep '$TEST_GREP' \
            '$TEST_PATH'"

