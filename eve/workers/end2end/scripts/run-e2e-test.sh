#!/bin/sh

set -exu

DIR=$(dirname $0)

. "$DIR/common.sh"

ZENKO_NAME=${1:-end2end}
E2E_IMAGE=${2:-registry.scality.com/zenko/zenko-e2e:latest}
STAGE=${3:-end2end}
NAMESPACE=${4:-default}

POD_NAME="${ZENKO_NAME}-${STAGE}-test"
TOKEN=$(get_token)

# set environment vars
CLOUDSERVER_ENDPOINT="http://${ZENKO_NAME}-connector-s3api.default.svc.cluster.local:80"
BACKBEAT_API_ENDPOINT="http://${ZENKO_NAME}-management-backbeat-api.default.svc.cluster.local:80"
ZENKO_ACCESS_KEY=$(kubectl get secret end2end-account-zenko -o jsonpath='{.data.AccessKeyId}' | base64 -d)
ZENKO_SECRET_KEY=$(kubectl get secret end2end-account-zenko -o jsonpath='{.data.SecretAccessKey}' | base64 -d)
ZENKO_SESSION_TOKEN=$(kubectl get secret end2end-account-zenko -o jsonpath='{.data.SessionToken}' | base64 -d)
OIDC_FULLNAME="${OIDC_FIRST_NAME} ${OIDC_LAST_NAME}"

run_e2e_test() {
   kubectl apply -f - <<EOF
---
apiVersion: v1
kind: Pod
metadata:
  labels:
    run: "${POD_NAME}"
  name: "${POD_NAME}"
spec:
  containers:
  - name: "${POD_NAME}"
    command: ['sh', '-c']
    args: ["${2}"]
    env:
    - name: CLOUDSERVER_ENDPOINT
      value: "${CLOUDSERVER_ENDPOINT}"
    - name: ZENKO_ACCESS_KEY
      value: "${ZENKO_ACCESS_KEY}"
    - name: ZENKO_SECRET_KEY
      value: "${ZENKO_SECRET_KEY}"
    - name: ZENKO_SESSION_TOKEN
      value: "${ZENKO_SESSION_TOKEN}"
    - name: TOKEN
      value: "${TOKEN}"
    - name: STAGE
      value: "${STAGE}"
    - name: CYPRESS_KEYCLOAK_USER_FULLNAME
      value: "${OIDC_FULLNAME}"
    - name: CYPRESS_KEYCLOAK_USERNAME
      value: "${OIDC_USERNAME}"
    - name: CYPRESS_KEYCLOAK_PASSWORD
      value: "${OIDC_PASSWORD}"
    - name: CYPRESS_KEYCLOAK_ROOT
      value: "${OIDC_ENDPOINT}"
    - name: CYPRESS_KEYCLOAK_CLIENT_ID
      value: "${OIDC_CLIENT_ID}"
    - name: CYPRESS_KEYCLOAK_REALM
      value: "${OIDC_REALM}"
    - name: UI_ENDPOINT
      value: "${UI_ENDPOINT}"
    image: "${E2E_IMAGE}"
    imagePullPolicy: Always
    volumeMounts:
    - name: artifacts
      mountPath: /artifacts
  restartPolicy: Never
  volumes:
  - name: artifacts
    hostPath:
      path: "/data/${POD_NAME}"
      type: "DirectoryOrCreate"
EOF
}

## TODO use existing entrypoint
if [ "$STAGE" = "end2end" ]; then
   run_e2e_test '' 'cd node_tests && npm run test_operator && npm run test_ui'
elif [ "$STAGE" = "debug" ]; then
   run_e2e_test '-ti' 'bash'
fi

KUBECTL=$(which kubectl) E2E_POD=${POD_NAME} NAMESPACE=${NAMESPACE} $DIR/follow_logs.sh
