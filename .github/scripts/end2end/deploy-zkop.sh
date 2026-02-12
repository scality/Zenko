#!/usr/bin/env bash

set -ex

[ -z "${OPERATOR_IMAGE_NAME}" ] && OPERATOR_IMAGE_NAME="$(yq eval '."zenko-operator" | .sourceRegistry + "/" + .image' solution/deps.yaml)"
[ -z "${OPERATOR_IMAGE_TAG}" ] && OPERATOR_IMAGE_TAG="$(yq eval '."zenko-operator".tag' solution/deps.yaml)"

docker pull "${OPERATOR_IMAGE_NAME}:${OPERATOR_IMAGE_TAG}" || true
# kind load docker-image "${OPERATOR_IMAGE_NAME}:${OPERATOR_IMAGE_TAG}"

OPERATOR_PATH=./.github/scripts/end2end/operator
git init $OPERATOR_PATH
cd $OPERATOR_PATH
git fetch --depth 1 --no-tags https://github.com/scality/zenko-operator.git ${OPERATOR_IMAGE_TAG}
git checkout FETCH_HEAD

tilt ci