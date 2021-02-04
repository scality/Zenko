#!/bin/sh

set -exu

DIR=$(dirname "$0")

export ZENKO_NAME=${1:-end2end}
export NAMESPACE=${2:-default}
export ZENKO_VERSION_NAME="${ZENKO_NAME}-version"

envsubst < $DIR/configs/zenkoversion.yaml | kubectl -n ${NAMESPACE} apply -f -
envsubst < $DIR/configs/zenko.yaml | kubectl -n ${NAMESPACE} apply -f -
kubectl wait --for condition=Available --timeout 10m --namespace ${NAMESPACE} zenko/${ZENKO_NAME}
