#!/bin/sh

set -exu

DIR=$(dirname "${0}")
. "$DIR"/common.sh

ZENKO_NAME=${1:-end2end}
NAMESPACE=${2:-default}

. "$DIR/configure-e2e-endpoints.sh"

MANAGEMENT_HOST=$(kubectl get ingress -n "${NAMESPACE}" -l "app.kubernetes.io/instance=${ZENKO_NAME}" \
    -o jsonpath='{.items[*].spec.rules[*].host}' | tr ' ' '\n' | grep '^management')
IAM_HOST=$(kubectl get ingress -n "${NAMESPACE}" -l "app.kubernetes.io/instance=${ZENKO_NAME}" \
    -o jsonpath='{.items[*].spec.rules[*].host}' | tr ' ' '\n' | grep '^iam')
STS_HOST=$(kubectl get ingress -n "${NAMESPACE}" -l "app.kubernetes.io/instance=${ZENKO_NAME}" \
    -o jsonpath='{.items[*].spec.rules[*].host}' | tr ' ' '\n' | grep '^sts')
MANAGEMENT_ENDPOINT="http://${MANAGEMENT_HOST}"
IAM_ENDPOINT="http://${IAM_HOST}"
STS_ENDPOINT="http://${STS_HOST}"

# Collect all ingress hosts for this Zenko instance and add to /etc/hosts
ALL_INGRESS_HOSTS=$(kubectl get ingress -n "${NAMESPACE}" -l "app.kubernetes.io/instance=${ZENKO_NAME}" \
    -o jsonpath='{.items[*].spec.rules[*].host}' | tr ' ' '\n' | sort -u | tr '\n' ' ')
if ! grep -q "${MANAGEMENT_HOST}" /etc/hosts 2>/dev/null; then
    echo "127.0.0.1 ${ALL_INGRESS_HOSTS}" | sudo tee -a /etc/hosts
fi
UUID=$(kubectl get zenko ${ZENKO_NAME} --namespace ${NAMESPACE} -o jsonpath='{.status.instanceID}')
TOKEN=$(get_token)

kafka_image() {
    source <( "$DIR"/../../../solution/kafka_build_vars.sh )
    echo "$KAFKA_IMAGE:$KAFKA_TAG-$BUILD_TREE_HASH"
}

KAFKA_IMAGE=$(kafka_image)
KAFKA_HOST_PORT=$(kubectl get secret -l app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=end2end \
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
    "kafka-topics.sh --create --topic $UUID.backbeat-replication-replay-0 --partitions 5 --bootstrap-server $KAFKA_HOST_PORT --if-not-exists ; \
    kafka-topics.sh --create --topic $UUID.backbeat-data-mover --partitions 5 --bootstrap-server $KAFKA_HOST_PORT --if-not-exists ; \
    kafka-topics.sh --create --topic $NOTIF_DEST_TOPIC --bootstrap-server $KAFKA_HOST_PORT --if-not-exists ; \
    kafka-topics.sh --create --topic $NOTIF_ALT_DEST_TOPIC --bootstrap-server $KAFKA_HOST_PORT --if-not-exists"

# Run configuration.py directly
ZENKO_TESTS_DIR="$DIR/../../../tests/zenko_tests"
pip3 install --break-system-packages -r "$ZENKO_TESTS_DIR/requirements.txt"

cd "$ZENKO_TESTS_DIR"

envsubst < e2e-config.yaml.template > e2e-config.yaml

RING_S3C_ENDPOINT_LOCAL="${RING_S3C_ENDPOINT}"
if kubectl get namespace metadata &>/dev/null; then
    RING_S3C_ENDPOINT_LOCAL="http://s3c.local"
fi

TOKEN=${TOKEN} \
UUID=${UUID} \
MANAGEMENT_ENDPOINT=${MANAGEMENT_ENDPOINT} \
IAM_ENDPOINT=${IAM_ENDPOINT} \
STS_ENDPOINT=${STS_ENDPOINT} \
NAMESPACE=${NAMESPACE} \
VERIFY_CERTIFICATES=false \
ENABLE_RING_TESTS=${ENABLE_RING_TESTS} \
RING_S3C_ACCESS_KEY=${RING_S3C_ACCESS_KEY} \
RING_S3C_SECRET_KEY=${RING_S3C_SECRET_KEY} \
RING_S3C_ENDPOINT=${RING_S3C_ENDPOINT_LOCAL} \
RING_S3C_BACKEND_SOURCE_LOCATION=${RING_S3C_BACKEND_SOURCE_LOCATION} \
RING_S3C_INGESTION_SRC_BUCKET_NAME=${RING_S3C_INGESTION_SRC_BUCKET_NAME} \
RING_S3C_BACKEND_SOURCE_NON_VERSIONED_LOCATION=${RING_S3C_BACKEND_SOURCE_NON_VERSIONED_LOCATION} \
RING_S3C_INGESTION_SRC_NON_VERSIONED_BUCKET_NAME=${RING_S3C_INGESTION_SRC_NON_VERSIONED_BUCKET_NAME} \
RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE=${RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE} \
AWS_ACCESS_KEY=${AWS_ACCESS_KEY} \
AWS_SECRET_KEY=${AWS_SECRET_KEY} \
AWS_ENDPOINT=${AWS_ENDPOINT} \
AWS_FAIL_BUCKET_NAME=${AWS_FAIL_BUCKET_NAME} \
AWS_REPLICATION_FAIL_CTST_BUCKET_NAME=${AWS_REPLICATION_FAIL_CTST_BUCKET_NAME} \
AZURE_BACKEND_DESTINATION_LOCATION=${AZURE_BACKEND_DESTINATION_LOCATION} \
AZURE_BACKEND_ENDPOINT=${AZURE_BACKEND_ENDPOINT} \
AZURE_BACKEND_QUEUE_ENDPOINT=${AZURE_BACKEND_QUEUE_ENDPOINT} \
AZURE_ACCOUNT_NAME=${AZURE_ACCOUNT_NAME} \
AZURE_SECRET_KEY=${AZURE_SECRET_KEY} \
AZURE_CRR_BUCKET_NAME=${AZURE_CRR_BUCKET_NAME} \
AZURE_ARCHIVE_BUCKET_NAME=${AZURE_ARCHIVE_BUCKET_NAME} \
AZURE_ARCHIVE_BUCKET_NAME_2=${AZURE_ARCHIVE_BUCKET_NAME_2} \
AZURE_ARCHIVE_QUEUE_NAME=${AZURE_ARCHIVE_QUEUE_NAME} \
CRR_SOURCE_LOCATION_NAME=${CRR_SOURCE_LOCATION_NAME} \
CRR_DESTINATION_LOCATION_NAME=${CRR_DESTINATION_LOCATION_NAME} \
CRR_SOURCE_ACCOUNT_NAME=${CRR_SOURCE_ACCOUNT_NAME} \
CRR_DESTINATION_ACCOUNT_NAME=${CRR_DESTINATION_ACCOUNT_NAME} \
CRR_ROLE_NAME=${CRR_ROLE_NAME} \
DEPLOY_CRR_LOCATIONS=${DEPLOY_CRR_LOCATIONS} \
python3 configuration.py

## wait for updates to trigger zenko upgrades
sleep 10

kubectl wait --for condition=DeploymentFailure=false --timeout 25m -n ${NAMESPACE} zenko/${ZENKO_NAME}
kubectl wait --for condition=DeploymentInProgress=false --timeout 25m -n ${NAMESPACE} zenko/${ZENKO_NAME}


if [ $ENABLE_RING_TESTS = true ]; then
  # wait for ingestion processor to start consuming from Kafka
  ingestion_processor_replicas=$(kubectl -n $NAMESPACE get deploy/end2end-backbeat-ingestion-processor -o jsonpath='{.spec.replicas}')
  wait_for_consumer_group $NAMESPACE $UUID.backbeat-ingestion-group $ingestion_processor_replicas 300
fi
