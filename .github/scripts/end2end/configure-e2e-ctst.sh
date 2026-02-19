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

export NOTIF_KAFKA_AUTH_HOST="${ZENKO_NAME}-base-queue-auth-0"
export NOTIF_KAFKA_AUTH_HOST_PORT="$NOTIF_KAFKA_AUTH_HOST:$NOTIF_KAFKA_PORT"
export NOTIF_KAFKA_AUTH_PORT=9094

# Add an extra SASL_PLAIN Kafka listener, to support testing authenticated Kafka for bucket notifications
kubectl get zookeepercluster "${ZENKO_NAME}-base-quorum" -o json | jq '.
| .metadata |= {namespace, name: "\(.name)-auth" }
| del(.spec.labels)
| del(.spec.persistence)
| .spec.storageType |= "ephemeral"
| .spec.pod.env |= . + [{name: "JMXDISABLE", value: "true"}]
| del(.spec.pod.affinity)
| del(.spec.pod.labels)
| del(.status)
' | kubectl apply -f -
kubectl wait --for=jsonpath='{.status.readyReplicas}'=1 --timeout 10m zookeepercluster "${ZENKO_NAME}-base-quorum-auth"

kubectl get kafkacluster "${ZENKO_NAME}-base-queue" -o json | jq '.
| .metadata |= {namespace, name: "\(.name)-auth" }
| del(.status)
| .spec.listenersConfig.internalListeners |= . + [{containerPort: 9094, name: "auth", type: "sasl_plaintext", usedForInnerBrokerCommunication: false}]
| .spec.readOnlyConfig |= (. + "
sasl.enabled.mechanisms=PLAIN
listener.name.auth.plain.sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required username=\"'"$NOTIF_AUTH_DEST_USERNAME"'\" password=\"'"$NOTIF_AUTH_DEST_PASSWORD"'\" user_'"$NOTIF_AUTH_DEST_USERNAME"'=\"'"$NOTIF_AUTH_DEST_PASSWORD"'\";
")
| del(.spec.brokerConfigGroups.default.storageConfigs[].pvcSpec)
| .spec.brokerConfigGroups.default.storageConfigs[].emptyDir |= {medium: "Memory"}
| .spec.zkAddresses |= ["'"${ZENKO_NAME}-base-quorum-auth-0.${ZENKO_NAME}-base-quorum-auth-headless:2181"'"]
| .spec.cruiseControlConfig.capacityConfig |= ({brokerCapacities: [{brokerId: "-1", capacity: {DISK: "1000", CPU: "100", NW_IN: "1000", NW_OUT: "1000"}}]} | tostring)
' | kubectl apply -f -
kubectl wait --for=jsonpath='{.status.state}'=ClusterRunning --timeout 10m kafkacluster "${ZENKO_NAME}-base-queue-auth"

UUID=$(kubectl get secret -l app.kubernetes.io/name=backbeat-config,app.kubernetes.io/instance=end2end \
    -o jsonpath='{.items[0].data.config\.json}' | base64 -di | jq .extensions.replication.topic)
UUID=${UUID%.*}
UUID=${UUID:1}

echo "127.0.0.1 iam.zenko.local s3-local-file.zenko.local keycloak.zenko.local \
    sts.zenko.local management.zenko.local s3.zenko.local website.mywebsite.com utilization.zenko.local" | sudo tee -a /etc/hosts

# Add bucket notification target
envsubst < ./configs/notification_destinations.yaml | kubectl apply -f -
# Wait for service stabilization
kubectl wait --for condition=DeploymentInProgress=true --timeout 10m zenko/${ZENKO_NAME}
kubectl wait --for condition=DeploymentFailure=false --timeout 10m zenko/${ZENKO_NAME}
kubectl wait --for condition=DeploymentInProgress=false --timeout 10m zenko/${ZENKO_NAME}

# Get kafka image name and tag
KAFKA_REGISTRY_NAME=$(yq eval ".kafka.sourceRegistry" ../../../solution/deps.yaml)
KAFKA_IMAGE_NAME=$(yq eval ".kafka.image" ../../../solution/deps.yaml)
KAFKA_IMAGE_TAG=$(yq eval ".kafka.tag" ../../../solution/deps.yaml)
KAFKA_IMAGE=$KAFKA_REGISTRY_NAME/$KAFKA_IMAGE_NAME:$KAFKA_IMAGE_TAG

# Cold location topic
AZURE_ARCHIVE_STATUS_TOPIC="${UUID}.cold-status-e2e-azure-archive"
AZURE_ARCHIVE_STATUS_TOPIC_2_NV="${UUID}.cold-status-e2e-azure-archive-2-non-versioned"
AZURE_ARCHIVE_STATUS_TOPIC_2_V="${UUID}.cold-status-e2e-azure-archive-2-versioned"
AZURE_ARCHIVE_STATUS_TOPIC_2_S="${UUID}.cold-status-e2e-azure-archive-2-suspended"

# Creating bucket notification topic in kafka
kubectl run kafka-topics \
    --image=$KAFKA_IMAGE \
    --pod-running-timeout=5m \
    --rm \
    --restart=Never \
    --attach=True \
    --command -- bash -c \
    "kafka-topics.sh --create --topic $NOTIF_DEST_TOPIC --bootstrap-server $KAFKA_HOST_PORT --if-not-exists ; \
        kafka-topics.sh --create --topic $NOTIF_ALT_DEST_TOPIC --bootstrap-server $KAFKA_HOST_PORT --if-not-exists ; \
        kafka-topics.sh --create --topic $NOTIF_AUTH_DEST_TOPIC --bootstrap-server $NOTIF_KAFKA_AUTH_HOST_PORT --if-not-exists ; \
        kafka-topics.sh --create --topic $AZURE_ARCHIVE_STATUS_TOPIC --partitions 10 --bootstrap-server $KAFKA_HOST_PORT --if-not-exists ; \
        kafka-topics.sh --create --topic $AZURE_ARCHIVE_STATUS_TOPIC_2_NV --partitions 10 --bootstrap-server $KAFKA_HOST_PORT --if-not-exists ; \
        kafka-topics.sh --create --topic $AZURE_ARCHIVE_STATUS_TOPIC_2_V --partitions 10 --bootstrap-server $KAFKA_HOST_PORT --if-not-exists ; \
        kafka-topics.sh --create --topic $AZURE_ARCHIVE_STATUS_TOPIC_2_S --partitions 10 --bootstrap-server $KAFKA_HOST_PORT --if-not-exists"
