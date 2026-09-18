#!/usr/bin/env bash

set -eu

SCRIPT_FULL_PATH=$(readlink -f "$0")
CURRENT_DIR=$(dirname "${SCRIPT_FULL_PATH}")

get_image_from_deps() {
    local dep_name=$1
    yq eval ".$dep_name | (.sourceRegistry // \"docker.io\") + \"/\" + .image" deps.yaml
}

cd "${CURRENT_DIR}"

# Our java images all build FROM the java image, so its tree has to feed their tree hashes: otherwise
# a change to the base would republish different content under an already-published tag.
JAVA_TREE=$(git rev-parse HEAD:solution/java)

cat <<EOF
scala_version=$(yq eval '.kafka.tag | split("-").[0]' deps.yaml)
kafka_version=$(yq eval '.kafka.tag | split("-").[1]' deps.yaml)
JAVA_IMAGE=$(get_image_from_deps java)
JAVA_TAG=$(yq eval '.java.tag' deps.yaml)
JAVA_BUILD_TREE_HASH=${JAVA_TREE}
KAFKA_IMAGE=$(get_image_from_deps kafka)
KAFKA_TAG=$(yq eval '.kafka.tag' deps.yaml)
KAFKA_CONNECT_IMAGE=$(get_image_from_deps kafka-connect)
KAFKA_CONNECT_TAG=$(yq eval '.kafka-connect.tag' deps.yaml)
JMX_JAVAAGENT_IMAGE=$(get_image_from_deps jmx-javaagent)
JMX_JAVAAGENT_TAG=$(yq eval '.jmx-javaagent.tag' deps.yaml)
MONGODB_CONNECTOR_TAG=$(yq eval '.mongodb-connector.tag' deps.yaml)
BUILD_TREE_HASH=$(git rev-parse HEAD:solution/kafka HEAD:solution/kafka-connect ${JAVA_TREE} | sha1sum | cut -d' ' -f1)
KAFKA_CRUISECONTROL_IMAGE=$(get_image_from_deps kafka-cruise-control)
KAFKA_CRUISECONTROL_TAG=$(yq eval '.kafka-cruise-control.tag' deps.yaml)
CRUISECONTROL_BUILD_TREE_HASH=$(git rev-parse HEAD:solution/cruise-control ${JAVA_TREE} | sha1sum | cut -d' ' -f1)
ZOOKEEPER_IMAGE=$(get_image_from_deps zookeeper)
ZOOKEEPER_TAG=$(yq eval '.zookeeper.tag' deps.yaml)
ZOOKEEPER_BUILD_TREE_HASH=$(git rev-parse HEAD:solution/zookeeper ${JAVA_TREE} | sha1sum | cut -d' ' -f1)
ZK_VERSION=$(yq eval '.zookeeper.tag | split("-").[0]' deps.yaml)
ZK_OPERATOR_VERSION=$(yq eval '.zookeeper.tag | sub("^[^-]*-"; "")' deps.yaml)
EOF
