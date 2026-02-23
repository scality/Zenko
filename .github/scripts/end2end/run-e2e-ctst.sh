#!/bin/bash
set -exu

# Usage: run-e2e-ctst.sh <TAGS>
# Examples:
#   run-e2e-ctst.sh "@PreMerge"
#   run-e2e-ctst.sh "@PreMerge and not @PRA"
#   run-e2e-ctst.sh "@PRA"

# Load environment configuration
DIR=$(dirname "$0")
source "$DIR/load-config.sh" ctst

TAGS=${1:?'Error: TAGS argument is required (e.g., "@PreMerge", "@PRA")'}
ZENKO_NAME="end2end"
PARALLEL_RUNS=${PARALLEL_RUNS:-$(( ( $(nproc) + 1 ) / 2 ))}

# Zenko Version
VERSION=$(cat ../../../VERSION | grep -Po 'VERSION="\K[^"]*')

# Setting CTST world params
WORLD_PARAMETERS="$(jq -c <<EOF
{
  "NotificationDestinationAuthUsername":"${NOTIF_AUTH_DEST_USERNAME}",
  "NotificationDestinationAuthPassword":"${NOTIF_AUTH_DEST_PASSWORD}",
  "KafkaExternalIps": "${KAFKA_EXTERNAL_IP:-}"
}
EOF
)"

# Set up environment variables for testing
kubectl set env deployment end2end-connector-cloudserver SCUBA_HEALTHCHECK_FREQUENCY=100
kubectl rollout status deployment end2end-connector-cloudserver

E2E_IMAGE=$E2E_CTST_IMAGE_NAME:$E2E_IMAGE_TAG
POD_NAME="end2end-ctst-tests"

# Configure keycloak
docker run \
  --rm \
  --network=host \
  "${E2E_IMAGE}" /bin/bash \
  -c "SUBDOMAIN=${SUBDOMAIN} \
    CONTROL_PLANE_INGRESS_ENDPOINT=${KEYCLOAK_TEST_ENDPOINT} \
    ACCOUNT=${ZENKO_ACCOUNT_NAME} \
    KEYCLOAK_REALM=${KEYCLOAK_TEST_REALM_NAME} \
    STORAGE_MANAGER=${STORAGE_MANAGER_USER_NAME} \
    STORAGE_ACCOUNT_OWNER=${STORAGE_ACCOUNT_OWNER_USER_NAME} \
    DATA_CONSUMER=${DATA_CONSUMER_USER_NAME} \
    DATA_ACCESSOR=${DATA_ACCESSOR_USER_NAME} \
    /ctst/node_modules/cli-testing/bin/seedKeycloak.sh"
[[ $? -eq 1 ]] && exit 1 || echo 'Keycloak Configured!'

# Grant access to Kube API (insecure, only for testing)
kubectl create clusterrolebinding serviceaccounts-cluster-admin \
  --clusterrole=cluster-admin \
  --group=system:serviceaccounts

# Running end2end ctst tests
# Using overrides as we need to attach a local folder to the pod
kubectl run $POD_NAME \
        --pod-running-timeout=5m \
        --image=$E2E_IMAGE \
        --restart=Never \
        --rm \
        --attach=True \
        --image-pull-policy=IfNotPresent \
        $(env_for_kubectl_run) \
        --env=TARGET_VERSION=$VERSION  \
        --env=VERBOSE=1 \
        --env=SDK=true \
        --override-type strategic \
        --overrides='
{
  "apiVersion": "v1",
  "kind": "Pod",
  "spec": {
    "containers": [
      {
        "name": "'$POD_NAME'",
        "volumeMounts": [
          {
            "name": "cold-data",
            "mountPath": "/cold-data"
          },
          {
            "name": "reports",
            "mountPath": "/reports"
          }
        ]
      }
    ],
    "volumes": [
      {
        "name": "cold-data",
        "persistentVolumeClaim": {
          "claimName": "sorbet-data"
        }
      },
      {
        "name": "reports",
        "hostPath": {
          "path": "/data/reports",
          "type": "DirectoryOrCreate"
        }
      }
    ]
  }
}' -- yarn cucumber-js \
    --config cucumber.config.cjs \
    --tags "${TAGS}" \
    --world-parameters "$WORLD_PARAMETERS" \
    --parallel $PARALLEL_RUNS \
    --retry 3 \
    --retry-tag-filter @Flaky \
    --format junit:/reports/ctst-junit.xml \
    --format html:/reports/report.html
