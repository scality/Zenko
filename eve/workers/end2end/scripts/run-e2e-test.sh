#!/bin/sh

set -exu

ZENKO_NAME=${1:-end2end}
E2E_IMAGE=${2:-registry.scality.com/zenko/zenko-e2e:latest}
STAGE=${3:-end2end}
NAMESPACE=${4:-default}

POD_NAME="${ZENKO_NAME}-${STAGE}-test"

# set environment vars
CLOUDSERVER_ENDPOINT="http://${ZENKO_NAME}-connector-s3api.default.svc.cluster.local:80"
BACKBEAT_API_ENDPOINT="http://${ZENKO_NAME}-management-backbeat-api.default.svc.cluster.local:80"
ZENKO_ACCESS_KEY=$(kubectl get secret ${ZENKO_NAME}-account-zenko -o jsonpath='{.data.accessKey}' | base64 -d)
ZENKO_SECRET_KEY=$(kubectl get secret ${ZENKO_NAME}-account-zenko -o jsonpath='{.data.secretKey}' | base64 -d)

run_e2e_test() {
    kubectl run ${POD_NAME} \
        --image ${E2E_IMAGE} \
        -ti \
        --attach=True \
        --restart=Never \
        --namespace=${NAMESPACE} \
        --image-pull-policy=Always \
        --env="CLOUDSERVER_ENDPOINT=${CLOUDSERVER_ENDPOINT}" \
        --env="ZENKO_ACCESS_KEY=${ZENKO_ACCESS_KEY}" \
        --env="ZENKO_SECRET_KEY=${ZENKO_SECRET_KEY}" \
        --env="STAGE=${STAGE}" \
        --command -- $@
}

## TODO use existing entrypoint
if [ "$STAGE" = "end2end" ]; then
   run_e2e_test sh -c 'cd node_tests && npm run test_operator'
fi

KUBECTL=$(which kubectl) E2E_POD=${POD_NAME} NAMESPACE=${NAMESPACE} tests/follow_logs.sh
