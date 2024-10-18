#!/bin/bash
set -exu

# Setup test environment variables
export ZENKO_NAME=${1:-"end2end"}
# Getting kafka host from backbeat's config
KAFKA_HOST_PORT=$(kubectl get secret -l app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=end2end \
    -o jsonpath='{.items[0].data.config\.json}' | base64 -di | jq .kafka.hosts)
KAFKA_HOST_PORT=${KAFKA_HOST_PORT:1:-1}
# Removing the port
export NOTIF_KAFKA_HOST=${KAFKA_HOST_PORT%:*}
export NOTIF_KAFKA_PORT=${KAFKA_HOST_PORT#*:}

echo "127.0.0.1 iam.zenko.local ui.zenko.local s3-local-file.zenko.local keycloak.zenko.local \
    sts.zenko.local management.zenko.local s3.zenko.local website.mywebsite.com" | sudo tee -a /etc/hosts

# Add bucket notification target
envsubst < ./configs/notification_destinations.yaml | kubectl apply -f -
# Wait for service stabilization
kubectl wait --for condition=DeploymentInProgress=true --timeout 10m zenko/${ZENKO_NAME}
kubectl wait --for condition=DeploymentFailure=false --timeout 10m zenko/${ZENKO_NAME}
kubectl wait --for condition=DeploymentInProgress=false --timeout 10m zenko/${ZENKO_NAME}
