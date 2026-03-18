#!/usr/bin/env bash

set -ex

[ -z "${OPERATOR_IMAGE_TAG}" ] && OPERATOR_IMAGE_TAG="$(yq eval '."zenko-operator".tag' solution/deps.yaml)"

OPERATOR_PATH=./.github/scripts/end2end/operator
git init $OPERATOR_PATH
cd $OPERATOR_PATH
git fetch --depth 1 --no-tags https://git:${GIT_ACCESS_TOKEN}@github.com/scality/zenko-operator.git ${OPERATOR_IMAGE_TAG}
git checkout FETCH_HEAD

tilt ci