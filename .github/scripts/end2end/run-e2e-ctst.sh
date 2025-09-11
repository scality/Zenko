#!/bin/bash
set -exu

ZENKO_NAME=${1:-end2end}
COMMAND=${2:-"premerge"}
PARALLEL_RUNS=${PARALLEL_RUNS:-$(( ( $(nproc) + 1 ) / 2 ))}
RETRIES=${4:-3}

shift 4

JUNIT_REPORT_PATH=${JUNIT_REPORT_PATH:-"ctst-junit.xml"}

# Zenko Version
VERSION=$(cat ../../../VERSION | grep -Po 'VERSION="\K[^"]*')

# Minimal environment setup - CTST will handle all Kubernetes discovery

# Minimal CTST world params - CTST handles all Kubernetes discovery
WORLD_PARAMETERS="$(jq -c <<EOF
{
  "Namespace":"default",
  "subdomain":"${SUBDOMAIN}",
  "DRSubdomain":"${DR_SUBDOMAIN}",
  "KeycloakUsername":"${OIDC_USERNAME:-testuser}",
  "KeycloakPassword":"${OIDC_PASSWORD:-testpass}",
  "KeycloakHost":"${OIDC_HOST:-keycloak.zenko.local}",
  "KeycloakRealm":"${OIDC_REALM:-zenko}",
  "KeycloakClientId":"${OIDC_CLIENT_ID:-zenko-ui}",
  "AzureAccountName":"${AZURE_ACCOUNT_NAME:-devstoreaccount1}",
  "AzureAccountKey":"${AZURE_SECRET_KEY:-Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==}",
  "AzureArchiveContainer":"${AZURE_ARCHIVE_BUCKET_NAME:-archive-container}",
  "AzureArchiveContainer2":"${AZURE_ARCHIVE_BUCKET_NAME_2:-archive-container-2}",
  "AzureArchiveQueue":"${AZURE_ARCHIVE_QUEUE_NAME:-archive-queue}"
}
EOF
)"

E2E_IMAGE=$E2E_CTST_IMAGE_NAME:$E2E_IMAGE_TAG
POD_NAME="${ZENKO_NAME}-ctst-tests"
CTST_VERSION=$(sed 's/.*"cli-testing": ".*#\(.*\)".*/\1/;t;d' ../../../tests/ctst/package.json)

# Grant CTST cluster-admin permissions (test environment only)
kubectl create clusterrolebinding ctst-cluster-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=default:default \
  --dry-run=client -o yaml | kubectl apply -f -

# Running end2end ctst tests
# Using overrides as we need to attach a local folder to the pod
kubectl run $POD_NAME \
        --pod-running-timeout=5m \
        --image=$E2E_IMAGE \
        --restart=Never \
        --rm \
        --attach=True \
        --image-pull-policy=IfNotPresent \
        --env=TARGET_VERSION=$VERSION \
        --env=SEED_KEYCLOAK_DEFAULT_ROLES=true \
        --env=AZURE_BLOB_URL=$AZURE_BACKEND_ENDPOINT \
        --env=AZURE_QUEUE_URL=$AZURE_BACKEND_QUEUE_ENDPOINT \
        --env=VERBOSE=1 \
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
}' -- ./run "$COMMAND" $WORLD_PARAMETERS --parallel $PARALLEL_RUNS --retry $RETRIES --retry-tag-filter @Flaky --format junit:$JUNIT_REPORT_PATH "$@"
