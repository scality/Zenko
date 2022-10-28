#!/bin/sh

set -exu

ZENKO_NAME=${1:-end2end}
NAMESPACE=${2:-default}

# Getting kafka host from backbeat's config
BACKBEAT_CONFIG_NAME=$(kubectl get secret -l app.kubernetes.io/name=backbeat-config --no-headers -o custom-columns=":metadata.name")
KAFKA_HOST_PORT=$(kubectl get secret $BACKBEAT_CONFIG_NAME -o jsonpath='{.data.config\.json}' | base64 --decode | jq .kafka.hosts)
KAFKA_HOST=${KAFKA_HOST_PORT:1:-1}

UUID=$(kubectl get zenko ${ZENKO_NAME} --namespace ${NAMESPACE} -o jsonpath='{.status.instanceID}')
INGESTION_KAFKA_TOPIC="${UUID}.backbeat-ingestion"

# Get kafka image name and tag
KAFKA_REGISTRY_NAME=$(yq eval ".kafka.sourceRegistry" ../../../solution/deps.yaml)
KAFKA_IMAGE_NAME=$(yq eval ".kafka.image" ../../../solution/deps.yaml)
KAFKA_IMAGE_TAG=$(yq eval ".kafka.tag" ../../../solution/deps.yaml)
KAFKA_IMAGE=$KAFKA_REGISTRY_NAME/$KAFKA_IMAGE_NAME:$KAFKA_IMAGE_TAG

# Creating ingestion topic
kubectl run kafka-topics \
    --image=$KAFKA_IMAGE \
    --pod-running-timeout=5m \
    --rm \
    --restart=Never \
    --attach=True \
    --command -- bash -c \
    "kafka-topics.sh --create --topic $INGESTION_KAFKA_TOPIC --bootstrap-server $KAFKA_HOST"