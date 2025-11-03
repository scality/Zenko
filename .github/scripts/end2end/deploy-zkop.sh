#!/usr/bin/env bash

set -ex

[ -z "${OPERATOR_IMAGE_NAME}" ] && OPERATOR_IMAGE_NAME="$(yq eval '."zenko-operator" | .sourceRegistry + "/" + .image' solution/deps.yaml)"
[ -z "${OPERATOR_IMAGE_TAG}" ] && OPERATOR_IMAGE_TAG="$(yq eval '."zenko-operator".tag' solution/deps.yaml)"

docker pull "${OPERATOR_IMAGE_NAME}:${OPERATOR_IMAGE_TAG}"
kind load docker-image "${OPERATOR_IMAGE_NAME}:${OPERATOR_IMAGE_TAG}"

kustomize build https://git:${GIT_ACCESS_TOKEN}@github.com/scality/zenko-operator/config/default  | kubectl apply -f - --server-side=true