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
MONGODB_BUILD_TREE_HASH=$(git rev-parse HEAD:solution-base/images)
MONGODB_SHARDED_IMAGE=$(get_image_from_deps mongodb-sharded)
MONGODB_SHARDED_TAG=$(yq eval '.mongodb-sharded.tag' deps.yaml)
MONGODB_SHARDED_EXPORTER_IMAGE=$(get_image_from_deps mongodb-sharded-exporter)
MONGODB_SHARDED_EXPORTER_TAG=$(yq eval '.mongodb-sharded-exporter.tag' deps.yaml)
MONGODB_SHARDED_SHELL_IMAGE=$(get_image_from_deps mongodb-shell)
MONGODB_SHARDED_SHELL_TAG=$(yq eval '.mongodb-shell.tag' deps.yaml)
EOF
