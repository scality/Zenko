#!/bin/bash
set -exu

ZENKO_NAME=${1:-end2end}
COMMAND=${2:-"premerge"}
PARALLEL_RUNS=${3:-10}
RETRIES=${4:-3}

# Zenko Version
VERSION=$(cat ../../../VERSION | grep -Po 'VERSION="\K[^"]*')

# Zenko Access Keys
ZENKO_ACCOUNT_NAME="zenko"
ZENKO_ACCESS_KEY=$(kubectl get secret end2end-account-zenko -o jsonpath='{.data.AccessKeyId}' | base64 -d)
ZENKO_SECRET_KEY=$(kubectl get secret end2end-account-zenko -o jsonpath='{.data.SecretAccessKey}' | base64 -d)
ZENKO_SESSION_TOKEN=$(kubectl get secret end2end-account-zenko -o jsonpath='{.data.SessionToken}' | base64 -d)
ZENKO_PORT="80"

# Extracting kafka host from bacbeat's config
KAFKA_HOST_PORT=$(kubectl get secret -l app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=end2end \
    -o jsonpath='{.items[0].data.config\.json}' | base64 -di | jq .kafka.hosts)
KAFKA_HOST_PORT=${KAFKA_HOST_PORT:1:-1}

# Setting CTST world params
WORLD_PARAMETERS='{"subdomain":"'${SUBDOMAIN}'","ssl":false,"port":"'${ZENKO_PORT}'","AccountName":"'${ZENKO_ACCOUNT_NAME}'","AccountAccessKey":"'${ZENKO_ACCESS_KEY}'","AccountSecretKey":"'${ZENKO_SECRET_KEY}'","AccountSessionToken":"'${ZENKO_SESSION_TOKEN}'","NotificationDestination":"'${NOTIF_DEST_NAME}'","NotificationDestinationTopic":"'${NOTIF_DEST_TOPIC}'","NotificationDestinationAlt":"'${NOTIF_ALT_DEST_NAME}'","NotificationDestinationTopicAlt":"'${NOTIF_ALT_DEST_TOPIC}'","KafkaHosts":"'${KAFKA_HOST_PORT}'"}'

E2E_IMAGE=$E2E_CTST_IMAGE_NAME:$E2E_IMAGE_TAG
POD_NAME="${ZENKO_NAME}-ctst-tests"

# Running end2end ctst tests
kubectl run $POD_NAME \
        --pod-running-timeout=5m \
        --image=$E2E_IMAGE \
        --restart=Never \
        --rm \
        --attach=True \
        --image-pull-policy=Always \
        --env=TARGET_VERSION=$VERSION  \
        --env=VERBOSE=1 \
        -- ./run "$COMMAND" $WORLD_PARAMETERS "--parallel $PARALLEL_RUNS --retry $RETRIES --retry-tag-filter @Flaky --tags @IAM-Policies-ARWWI"
