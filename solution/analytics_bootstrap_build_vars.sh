#!/usr/bin/env bash

set -eu

SCRIPT_FULL_PATH=$(readlink -f "$0")
CURRENT_DIR=$(dirname "${SCRIPT_FULL_PATH}")

get_image_from_deps() {
    local dep_name=$1
    yq eval ".$dep_name | (.sourceRegistry // \"docker.io\") + \"/\" + .image" deps.yaml
}

cd "${CURRENT_DIR}"
ANALYTICS_BOOTSTRAP_IMAGE=$(get_image_from_deps analytics-bootstrap)
ANALYTICS_BOOTSTRAP_TAG=$(yq eval '.analytics-bootstrap.tag' deps.yaml)
ANALYTICS_BOOTSTRAP_BUILD_TREE_HASH=$(git rev-parse HEAD:solution/analytics-bootstrap)

cat <<EOF
ANALYTICS_BOOTSTRAP_IMAGE=${ANALYTICS_BOOTSTRAP_IMAGE}
ANALYTICS_BOOTSTRAP_TAG=${ANALYTICS_BOOTSTRAP_TAG}
ANALYTICS_BOOTSTRAP_BUILD_TREE_HASH=${ANALYTICS_BOOTSTRAP_BUILD_TREE_HASH}
EOF
