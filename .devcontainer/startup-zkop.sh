#!/bin/bash

set -exu;
export OPERATOR_IMAGE_NAME=$(yq eval '."zenko-operator" | .sourceRegistry + "/" + .image' solution/deps.yaml)
export OPERATOR_IMAGE_TAG=$(yq eval '."zenko-operator".tag' solution/deps.yaml)
docker pull ${OPERATOR_IMAGE_NAME}:${OPERATOR_IMAGE_TAG}
kind load docker-image ${OPERATOR_IMAGE_NAME}:${OPERATOR_IMAGE_TAG}
cd ./.github/scripts/end2end
git clone https://${GIT_ACCESS_TOKEN}@github.com/scality/zenko-operator.git operator
cd operator
git checkout ${OPERATOR_IMAGE_TAG}
tilt ci