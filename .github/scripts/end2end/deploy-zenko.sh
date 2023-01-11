#!/bin/sh

set -exu

DIR=$(dirname "$0")

export ZENKO_NAME=${1:-end2end}
export NAMESPACE=${2:-default}
export ZENKO_CR_PATH=${3:-'./configs/zenko.yaml'}
export ZENKOVERSION_PATH=${4:-'./configs/zenkoversion.yaml'}
export DEPS_PATH=${5:-'../../../solution/deps.yaml'}
export ZENKO_VERSION_NAME="${ZENKO_NAME}-version"

export BACKBEAT_LCC_CRON_RULE=${BACKBEAT_LCC_CRON_RULE:-'*/5 * * * * *'}

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

# TODO: use kustomize
ZENKO_MONGODB_SHARDED=${ZENKO_MONGODB_SHARDED:-'false'}
if [ ${ZENKO_MONGODB_SHARDED} == 'true' ]; then
    export ZENKO_ANNOTATIONS="annotations:
    zenko.io/x-backbeat-oneshard-replicaset: data-db-mongodb-sharded-shard-0
    zenko.io/x-backbeat-oneshard-replicaset-hosts: data-db-mongodb-sharded-shard0-data-0.data-db-mongodb-sharded-headless.default.svc.cluster.local:27017"
    export ZENKO_MONGODB_ENDPOINT="data-db-mongodb-sharded.default.svc.cluster.local:27017"
    export ZENKO_MONGODB_CONFIG="writeConcern: 'majority'
    enableSharding: true"
else 
    export ZENKO_MONGODB_ENDPOINT="dev-db-mongodb-primary-0.dev-db-mongodb-headless.default.svc.cluster.local:27017"
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

function dependencies_policy_env()
{
    yq eval '.[] | .envsubst + "=" + (.sourceRegistry // "docker.io") + "/" + .policy' ${DEPS_PATH} |
        sed 's/_TAG=/_POLICY=/g'
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
    echo $(dependencies_policy_env)
    echo "ZENKO_VERSION_NAME=${ZENKO_NAME}-version"
}

create_encryption_secret()
{
    PUBLIC=$(mktemp zenko-key.pub.XXXXXX)
    PRIVATE=$(mktemp zenko-key.XXXXXX)
    trap 'rm -f "$PUBLIC" "$PRIVATE"' EXIT INT HUP TERM

    openssl genrsa -out "$PRIVATE"
    openssl rsa -in "$PRIVATE" -pubout -out "$PUBLIC"

    AZURE_SECRET_KEY_ENCRYPTED="$(
        printf '%s' "${AZURE_SECRET_KEY}" \
        | openssl pkeyutl -encrypt -pubin -inkey "$PUBLIC" \
                  -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 -pkeyopt rsa_mgf1_md:sha256 \
        | base64 -w 0
    )"

    # Zkop expects PKCS#1 format, but with a type of 'PRIVATE KEY' as generated with older openssl
    sed -i 's/RSA PRIVATE KEY/PRIVATE KEY/' "$PRIVATE"
    
    kubectl create secret generic ${ZENKO_NAME}-keypair.v0 \
        --namespace ${NAMESPACE} \
        --from-file=publicKey="$PUBLIC" \
        --from-file=privateKey="$PRIVATE"

    export AZURE_SECRET_KEY_ENCRYPTED
}

create_encryption_secret

env $(dependencies_env) envsubst < ${ZENKOVERSION_PATH} | kubectl -n ${NAMESPACE} apply -f -
envsubst < ${ZENKO_CR_PATH} | kubectl -n ${NAMESPACE} apply -f -

k_cmd="kubectl -n ${NAMESPACE} get zenko/${ZENKO_NAME}"
for i in $(seq 1 120); do
    conditions=$($k_cmd -o "jsonpath={.status.conditions}")
    if kubectl wait --for condition=Available --timeout 5s --namespace ${NAMESPACE} zenko/${ZENKO_NAME}; then
        break;
    fi
done
