#!/bin/sh

set -exu

. "$(dirname $0)/common.sh"

ZENKO_NAME=${1:-end2end}
E2E_IMAGE=${2:-registry.scality.com/zenko/zenko-e2e:latest}
NAMESPACE=${3:-default}

SERVICE_ACCOUNT="${ZENKO_NAME}-config"
POD_NAME="${ZENKO_NAME}-config"
MANAGEMENT_ENDPOINT="http://${ZENKO_NAME}-management-orbit-api:5001"
VAULT_ENDPOINT="http://${ZENKO_NAME}-connector-vault-sts-api"
UUID=$(kubectl get zenko ${ZENKO_NAME} --namespace ${NAMESPACE} -o jsonpath='{.status.instanceID}')
TOKEN=$(get_token)

cat <<EOF | kubectl apply -f -
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${SERVICE_ACCOUNT}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ${SERVICE_ACCOUNT}
rules:
- apiGroups:
  - ""
  resources:
  - secrets
  verbs:
  - '*'
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: ${SERVICE_ACCOUNT}
subjects:
- kind: ServiceAccount
  name: ${SERVICE_ACCOUNT}
roleRef:
  kind: Role
  name: ${SERVICE_ACCOUNT}
  apiGroup: rbac.authorization.k8s.io
EOF

kubectl run ${POD_NAME} \
  --image ${E2E_IMAGE} \
  --rm \
  --attach=True \
  --restart=Never \
  --namespace=${NAMESPACE} \
  --image-pull-policy=Always \
  --serviceaccount="${SERVICE_ACCOUNT}" \
  --env="TOKEN=${TOKEN}" \
  --env="UUID=${UUID}" \
  --env="MANAGEMENT_ENDPOINT=${MANAGEMENT_ENDPOINT}" \
  --env="VAULT_ENDPOINT=${VAULT_ENDPOINT}" \
  --env="NAMESPACE=${NAMESPACE}" \
  --env=VERIFY_CERTIFICATES=false \
  --env=RING_S3C_ACCESS_KEY=${RING_S3C_ACCESS_KEY} \
  --env=RING_S3C_SECRET_KEY=${RING_S3C_SECRET_KEY} \
  --env=RING_S3C_ENDPOINT=${RING_S3C_ENDPOINT} \
  --env=RING_S3C_BACKEND_SOURCE_LOCATION=${RING_S3C_BACKEND_SOURCE_LOCATION} \
  --env=RING_S3C_INGESTION_SRC_BUCKET_NAME=${RING_S3C_INGESTION_SRC_BUCKET_NAME} \
  --command -- sh "python3 create_buckets.py && python3 configuration.py"

## wait for updates to trigger zenko upgrades
sleep 10

kubectl wait --for condition=DeploymentFailure=false --timeout 10m -n ${NAMESPACE} zenko/${ZENKO_NAME}
kubectl wait --for condition=DeploymentInProgress=false --timeout 10m -n ${NAMESPACE} zenko/${ZENKO_NAME}
