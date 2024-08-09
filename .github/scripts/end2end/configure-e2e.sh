#!/bin/sh

set -exu

. "$(dirname $0)/common.sh"

ZENKO_NAME=${1:-end2end}
E2E_IMAGE=${2:-ghcr.io/scality/zenko/zenko-e2e:latest}
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

KAFKA_REGISTRY_NAME=$(yq eval ".kafka.sourceRegistry" ../../../solution/deps.yaml)
KAFKA_IMAGE_NAME=$(yq eval ".kafka.image" ../../../solution/deps.yaml)
KAFKA_IMAGE_TAG=$(yq eval ".kafka.tag" ../../../solution/deps.yaml)
KAFKA_IMAGE=$KAFKA_REGISTRY_NAME/$KAFKA_IMAGE_NAME:$KAFKA_IMAGE_TAG
KAFKA_HOST_PORT=$(kubectl get secret -l app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=${ZENKO_NAME} \
    -o jsonpath='{.items[0].data.config\.json}' | base64 -di | jq .kafka.hosts)
KAFKA_HOST_PORT=${KAFKA_HOST_PORT:1:-1}

# Creating replication/transition and notification topics in kafka
kubectl run kafka-topics \
    --image=$KAFKA_IMAGE \
    --pod-running-timeout=5m \
    --rm \
    --restart=Never \
    --attach=True \
    --command -- bash -c \
    "kafka-topics.sh --create --topic $UUID.backbeat-replication-replay-0 --partitions 5 --bootstrap-server $KAFKA_HOST_PORT ; \
    kafka-topics.sh --create --topic $UUID.backbeat-data-mover --partitions 5 --bootstrap-server $KAFKA_HOST_PORT ; \
    kafka-topics.sh --create --topic $NOTIF_DEST_TOPIC --bootstrap-server $KAFKA_HOST_PORT ; \
    kafka-topics.sh --create --topic $NOTIF_ALT_DEST_TOPIC --bootstrap-server $KAFKA_HOST_PORT"

kubectl run ${POD_NAME} \
  --image ${E2E_IMAGE} \
  --rm \
  --attach=True \
  --restart=Never \
  --pod-running-timeout=5m \
  --namespace=${NAMESPACE} \
  --image-pull-policy=IfNotPresent \
  --overrides="{ \"spec\": { \"serviceAccount\": \"${SERVICE_ACCOUNT}\" }  }" \
  --env="TOKEN=${TOKEN}" \
  --env="UUID=${UUID}" \
  --env="MANAGEMENT_ENDPOINT=${MANAGEMENT_ENDPOINT}" \
  --env="VAULT_ENDPOINT=${VAULT_ENDPOINT}" \
  --env="NAMESPACE=${NAMESPACE}" \
  --env=VERIFY_CERTIFICATES=false \
  --env=ENABLE_RING_TESTS=${ENABLE_RING_TESTS} \
  --env=RING_S3C_ACCESS_KEY=${RING_S3C_ACCESS_KEY} \
  --env=RING_S3C_SECRET_KEY=${RING_S3C_SECRET_KEY} \
  --env=RING_S3C_ENDPOINT=${RING_S3C_ENDPOINT} \
  --env=RING_S3C_BACKEND_SOURCE_LOCATION=${RING_S3C_BACKEND_SOURCE_LOCATION} \
  --env=RING_S3C_INGESTION_SRC_BUCKET_NAME=${RING_S3C_INGESTION_SRC_BUCKET_NAME} \
  --env=AWS_ACCESS_KEY=${AWS_ACCESS_KEY} \
  --env=AWS_SECRET_KEY=${AWS_SECRET_KEY} \
  --env=AWS_ENDPOINT=${AWS_ENDPOINT} \
  --env=AWS_FAIL_BUCKET_NAME=${AWS_FAIL_BUCKET_NAME} \
  --env=AZURE_BACKEND_DESTINATION_LOCATION=${AZURE_BACKEND_DESTINATION_LOCATION} \
  --env=AZURE_BACKEND_ENDPOINT=${AZURE_BACKEND_ENDPOINT} \
  --env=AZURE_BACKEND_QUEUE_ENDPOINT=${AZURE_BACKEND_QUEUE_ENDPOINT} \
  --env=AZURE_ACCOUNT_NAME=${AZURE_ACCOUNT_NAME} \
  --env=AZURE_SECRET_KEY=${AZURE_SECRET_KEY} \
  --env=AZURE_CRR_BUCKET_NAME=${AZURE_CRR_BUCKET_NAME} \
  --env=AZURE_ARCHIVE_BUCKET_NAME=${AZURE_ARCHIVE_BUCKET_NAME} \
  --env=AZURE_ARCHIVE_QUEUE_NAME=${AZURE_ARCHIVE_QUEUE_NAME} \
  --command -- python3 configuration.py

## wait for updates to trigger zenko upgrades
sleep 10

kubectl wait --for condition=DeploymentFailure=false --timeout 25m -n ${NAMESPACE} zenko/${ZENKO_NAME}
kubectl wait --for condition=DeploymentInProgress=false --timeout 25m -n ${NAMESPACE} zenko/${ZENKO_NAME}
