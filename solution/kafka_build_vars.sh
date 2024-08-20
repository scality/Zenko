#!/usr/bin/env bash

set -eu

SCRIPT_FULL_PATH=$(readlink -f "$0")
CURRENT_DIR=$(dirname "${SCRIPT_FULL_PATH}")

get_image_from_deps() {
    local dep_name=$1
    yq eval ".$dep_name | (.sourceRegistry // \"docker.io\") + \"/\" + .image" deps.yaml
}

cd "${CURRENT_DIR}"
cat <<EOF
scala_version=$(yq eval '.kafka.tag | split("-").[0]' deps.yaml)
kafka_version=$(yq eval '.kafka.tag | split("-").[1]' deps.yaml)
KAFKA_IMAGE=$(get_image_from_deps kafka)
KAFKA_TAG=$(yq eval '.kafka.tag' deps.yaml)
KAFKA_CONNECT_IMAGE=$(get_image_from_deps kafka-connect)
KAFKA_CONNECT_TAG=$(yq eval '.kafka-connect.tag' deps.yaml)
JMX_JAVAAGENT_IMAGE=$(get_image_from_deps jmx-javaagent)
JMX_JAVAAGENT_TAG=$(yq eval '.jmx-javaagent.tag' deps.yaml)
MONGODB_CONNECTOR_TAG=$(yq eval '.mongodb-connector.tag' deps.yaml)
BUILD_TREE_HASH=$(git rev-parse HEAD:solution/kafka)
EOF
