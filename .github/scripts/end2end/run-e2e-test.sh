#!/usr/bin/env bash

set -exu

DIR=$(dirname $0)

. "$DIR/common.sh"

# Load environment configuration
source "$DIR/load-config.sh" e2e

ZENKO_NAME=${1:-end2end}
E2E_IMAGE=${2:-ghcr.io/scality/zenko/zenko-e2e:latest}
STAGE=${3:-end2end}
NAMESPACE=${4:-default}

BACKBEAT_BUCKET_CHECK_TIMEOUT_S=${BACKBEAT_BUCKET_CHECK_TIMEOUT_S:-10}

POD_NAME="${ZENKO_NAME}-${STAGE//_/-}-test"
TOKEN=$(get_token)

run_e2e_test() {
    kubectl run ${1} ${POD_NAME} \
        --pod-running-timeout=5m \
        --image ${E2E_IMAGE} \
        --restart=Never \
        --rm \
        --attach=True \
        --namespace=${NAMESPACE} \
        --image-pull-policy=Always \
        $(env_for_kubectl_run) \
        --env=TOKEN=${TOKEN} \
        --env=STAGE=${STAGE} \
        --env=ENABLE_RING_TESTS=${ENABLE_RING_TESTS} \
        --env=KEYCLOAK_TEST_USER=${KEYCLOAK_TEST_USER} \
        --override-type strategic \
        --overrides='
{
  "apiVersion": "v1",
  "kind": "Pod",
  "spec": {
    "containers": [
      {
        "name": "'$POD_NAME'",
        "env": [
          {
            "name": "NODE_EXTRA_CA_CERTS",
            "value": "/etc/ssl/certs/ca-cert.pem"
          }
        ],
        "volumeMounts": [
          {
            "name": "reports",
            "mountPath": "/reports"
          },
          {
            "name": "ca-cert",
            "mountPath": "/etc/ssl/certs",
            "readOnly": true
          }
        ]
      }
    ],
    "volumes": [
      {
        "name": "reports",
        "hostPath": {
          "path": "/data/reports",
          "type": "DirectoryOrCreate"
        }
      },
      {
        "name": "ca-cert",
        "secret": {
          "secretName": "zenko-root-ca",
          "items": [
            {
              "key": "ca.crt",
              "path": "ca-cert.pem"
            }
          ]
        }
      }
    ]
  }
}' -- sh -c "${2}"

}

## TODO use existing entrypoint
if [ "$STAGE" = "end2end" ]; then
   ## TODO: re-add npm  run test_ui after ZENKO-4033
   run_e2e_test '' 'cd node_tests && npm run test_operator'
elif [ "$STAGE" = "debug" ]; then
   run_e2e_test '-ti' 'bash'
elif [ "$STAGE" = "smoke" ]; then
   run_e2e_test '' 'cd node_tests && npm run test_smoke'
elif [ "$STAGE" = "backbeat" ]; then
   ## TODO: use node js to create and remove buckets
   run_e2e_test '' 'cd node_tests && ./gcp_shim.sh && npm run test_all_extensions && cd .. && python3 cleans3c.py'
elif [ "$STAGE" = "iam-policies" ]; then
   run_e2e_test '' 'cd node_tests && npm run test_iam_policies'
elif [ "$STAGE" = "object-api" ]; then
   run_e2e_test '' 'cd node_tests && npm run test_object_api'
elif [ "$STAGE" = "lint" ]; then
   run_e2e_test '' 'cd node_tests && npm run lint'
fi
