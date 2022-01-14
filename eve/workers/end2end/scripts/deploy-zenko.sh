#!/bin/sh

set -exu

DIR=$(dirname "$0")

export ZENKO_NAME=${1:-end2end}
export NAMESPACE=${2:-default}
export ZENKO_CR_PATH=${3:-'eve/workers/end2end/scripts/configs/zenko.yaml'}
export ZENKOVERSION_PATH=${4:-'eve/workers/end2end/scripts/configs/zenkoversion.yaml'}
export DEPS_PATH=${5:-'solution/deps.yaml'}
export ZENKO_VERSION_NAME="${ZENKO_NAME}-version"

ENABLE_KEYCLOAK_HTTPS=${ENABLE_KEYCLOAK_HTTPS:-'false'}
if [ ${ENABLE_KEYCLOAK_HTTPS} == 'true' ]; then
    export ZENKO_INGRESS_ANNOTATIONS="annotations:
      nginx.ingress.kubernetes.io/proxy-body-size: 0m
      nginx.ingress.kubernetes.io/ssl-redirect: 'false'"
    export ZENKO_INGRESS_CERTIFICATES='certificates:
    - hosts:
      - ui.zenko.local
      - management.zenko.local
      - iam.zenko.local
      - sts.zenko.local'
else
    export ZENKO_INGRESS_ANNOTATIONS="annotations:
      nginx.ingress.kubernetes.io/proxy-body-size: 0m"
    export ZENKO_INGRESS_CERTIFICATES='certificates: []'
fi

function dependencies_image_env()
{
    yq eval '.[] | .envsubst + "=" + (.sourceRegistry // "docker.io") + "/" + .image' ${DEPS_PATH} |
        sed 's/_TAG=/_IMAGE=/g'
}

function dependencies_dashboard_env()
{
    yq eval '.[] | .envsubst + "=" + (.sourceRegistry // "docker.io") + "/" + .dashboard' ${DEPS_PATH} |
        sed 's/_TAG=/_DASHBOARD=/g'
}

function dependencies_versions_env()
{
    yq eval '.[] | .envsubst + "=" + .tag' ${DEPS_PATH}
}

function dependencies_env()
{
    echo $(dependencies_versions_env)
    echo $(dependencies_image_env)
    echo $(dependencies_dashboard_env)
    echo "ZENKO_VERSION_NAME=${ZENKO_NAME}-version"
}

env $(dependencies_env) envsubst < ${ZENKOVERSION_PATH} | kubectl -n ${NAMESPACE} apply -f -
envsubst < ${ZENKO_CR_PATH} | kubectl -n ${NAMESPACE} apply -f -
kubectl wait --for condition=Available --timeout 10m --namespace ${NAMESPACE} zenko/${ZENKO_NAME}
