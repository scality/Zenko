#!/usr/bin/env bash

set -exu

DIR=$(dirname "$0")

export ZENKO_NAME=${1:-end2end}
export NAMESPACE=${2:-default}
export ZENKO_CR_PATH=${3:-'./configs/zenko.yaml'}
export ZENKOVERSION_PATH=${4:-'./configs/zenkoversion.yaml'}
export DEPS_PATH=${5:-'../../../solution/deps.yaml'}
export ZENKO_VERSION_NAME="${ZENKO_NAME}-version"
export ZENKO_ANNOTATIONS=""
export ZENKO_MONGODB_SECRET_NAME=${ZENKO_MONGODB_SECRET_NAME:-'mongodb-db-creds'}
export ZENKO_IAM_INGRESS=${ZENKO_IAM_INGRESS:-'iam.zenko.local'}
export ZENKO_STS_INGRESS=${ZENKO_STS_INGRESS:-'sts.zenko.local'}
export ZENKO_MANAGEMENT_INGRESS=${ZENKO_MANAGEMENT_INGRESS:-'management.zenko.local'}
export ZENKO_S3_INGRESS=${ZENKO_S3_INGRESS:-'s3.zenko.local'}
export ZENKO_UI_INGRESS=${ZENKO_UI_INGRESS:-'ui.zenko.local'}
export ZENKO_SUR_INGRESS=${ZENKO_SUR_INGRESS:-'utilization.zenko.local'}

export BACKBEAT_LCC_CRON_RULE=${BACKBEAT_LCC_CRON_RULE:-'*/5 * * * * *'}

ENABLE_KEYCLOAK_HTTPS=${ENABLE_KEYCLOAK_HTTPS:-'false'}
if [ ${ENABLE_KEYCLOAK_HTTPS} == 'true' ]; then
    export ZENKO_INGRESS_ANNOTATIONS="annotations:
        nginx.ingress.kubernetes.io/proxy-body-size: 0m
        nginx.ingress.kubernetes.io/ssl-redirect: 'false'"
    export ZENKO_INGRESS_CERTIFICATES="certificates:
    - hosts:
      - ${ZENKO_UI_INGRESS}
      - ${ZENKO_MANAGEMENT_INGRESS}
      - ${ZENKO_IAM_INGRESS}
      - ${ZENKO_STS_INGRESS}
      - ${ZENKO_SUR_INGRESS}"
else
    export ZENKO_INGRESS_ANNOTATIONS="annotations:
      nginx.ingress.kubernetes.io/proxy-body-size: 0m"
    export ZENKO_INGRESS_CERTIFICATES='certificates: []'
fi

# TODO: use kustomize
export ZENKO_ANNOTATIONS="annotations:"
export ZENKO_MONGODB_ENDPOINT="data-db-mongodb-sharded.default.svc.cluster.local:27017"
export ZENKO_MONGODB_CONFIG="writeConcern: 'majority'
    enableSharding: true"
export ZENKO_MONGODB_DATABASE="${ZENKO_MONGODB_DATABASE:-datadb}"

if [ "${TIME_PROGRESSION_FACTOR}" -gt 1 ]; then
    export ZENKO_ANNOTATIONS="$ZENKO_ANNOTATIONS
    zenko.io/time-progression-factor: \"${TIME_PROGRESSION_FACTOR}\""
fi

export ZENKO_ANNOTATIONS="${ZENKO_ANNOTATIONS:-annotations:}
    zenko.io/dns-service-address: \"kube-dns.kube-system.svc\""

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

function dependencies_config_env()
{
    yq eval '.[] | .envsubst + "=" + (.sourceRegistry // "docker.io") + "/" + .config' ${DEPS_PATH} |
        sed 's/_TAG=/_CONFIG=/g'
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
    echo $(dependencies_config_env)
    echo "ZENKO_VERSION_NAME=${ZENKO_NAME}-version"
}

create_encryption_secret()
{
    PUBLIC=$(mktemp zenko-key.pub.XXXXXX)
    PRIVATE=$(mktemp zenko-key.XXXXXX)
    trap 'rm -f "$PUBLIC" "$PRIVATE"' EXIT INT HUP TERM

    # Get the OpenSSL version
    OPENSSL_VERSION=$(openssl version | awk '{print $2}')

    # Check if OpenSSL 3.x is being used
    if [[ $OPENSSL_VERSION =~ ^3\..* ]]; then
        # Use the "-traditional" flag for OpenSSL 3.x
        openssl genrsa -out "$PRIVATE" -traditional
    else
        openssl genrsa -out "$PRIVATE"
    fi

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
env $(dependencies_env) envsubst < ${ZENKO_CR_PATH} | kubectl -n ${NAMESPACE} apply -f -

# --- ZOOKEEPER ---
ZK_STS_NAME="${ZENKO_NAME}-base-quorum"
ZK_CONTAINER_NAME="zookeeper" # Confirmed container name
ZK_POD_NAME="${ZK_STS_NAME}-0"

echo "Waiting for Zookeeper StatefulSet (${ZK_STS_NAME})..."
for i in $(seq 1 60); do
    if kubectl get statefulset ${ZK_STS_NAME} -n ${NAMESPACE} > /dev/null 2>&1; then
        echo "Zookeeper StatefulSet found."
        break
    fi
    sleep 2
done

if ! kubectl get statefulset ${ZK_STS_NAME} -n ${NAMESPACE} > /dev/null 2>&1; then
    echo "ERROR: Timed out waiting for Zookeeper StatefulSet ${ZK_STS_NAME}."
    exit 1
fi

echo "Patching Zookeeper StatefulSet (${ZK_STS_NAME}) template to add JVMFLAGS..."
# Using JVMFLAGS based on colleague's working patch, but keeping JMX enabled
kubectl -n ${NAMESPACE} patch statefulset ${ZK_STS_NAME} --type='strategic' \
  -p '{
    "spec": {
      "template": {
        "spec": {
          "containers": [
            {
              "name": "'"${ZK_CONTAINER_NAME}"'",
              "env": [
                {
                  "name": "JVMFLAGS",
                  "value": "-Xmx512m -Xms512m -XX:-UseContainerSupport -XX:ActiveProcessorCount=1 -Djava.awt.headless=true -Dzookeeper.log.dir=/data/logs -Dzookeeper.root.logger=INFO,CONSOLE -Dlog4j.configuration=file:/data/conf/log4j.properties"
                }
              ]
            }
          ]
        }
      }
    }
  }'

echo "Deleting Zookeeper pod (${ZK_POD_NAME}) to apply patch..."
kubectl delete pod ${ZK_POD_NAME} -n ${NAMESPACE} --ignore-not-found=true --wait=false

echo "Waiting for Zookeeper pod (${ZK_POD_NAME}) to become Ready..."
if ! kubectl wait --for=condition=Ready pod/${ZK_POD_NAME} --timeout=300s -n ${NAMESPACE}; then
    echo "ERROR: Zookeeper pod ${ZK_POD_NAME} failed to become Ready after patching StatefulSet with JVMFLAGS."
    echo "Dumping Pod Logs:"
    kubectl logs pod/${ZK_POD_NAME} -n ${NAMESPACE} --tail=100 || echo "Could not get logs for ${ZK_POD_NAME}."
    echo "Describing Pod:"
    kubectl describe pod ${ZK_POD_NAME} -n ${NAMESPACE} || echo "Could not describe pod ${ZK_POD_NAME}."
    exit 1
fi
echo "Zookeeper pod ${ZK_POD_NAME} is Ready."

# --- KAFKA ---
KAFKA_STS_NAME="${ZENKO_NAME}-base-queue"
KAFKA_CONTAINER_NAME="kafka" # As seen in pod YAML previously
KAFKA_POD_NAME="${KAFKA_STS_NAME}-0"

echo "Waiting for Kafka StatefulSet (${KAFKA_STS_NAME})..."
for i in $(seq 1 150); do
    if kubectl get statefulset ${KAFKA_STS_NAME} -n ${NAMESPACE} > /dev/null 2>&1; then
        echo "Kafka StatefulSet found."
        break
    fi
    sleep 2
done

if ! kubectl get statefulset ${KAFKA_STS_NAME} -n ${NAMESPACE} > /dev/null 2>&1; then
    echo "ERROR: Timed out waiting for Kafka StatefulSet ${KAFKA_STS_NAME}."
    exit 1
fi

echo "Patching Kafka StatefulSet (${KAFKA_STS_NAME})..."
# Using standard JAVA_TOOL_OPTIONS for Kafka
kubectl -n ${NAMESPACE} patch statefulset ${KAFKA_STS_NAME} --type='strategic' \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"'"${KAFKA_CONTAINER_NAME}"'","env":[{"name":"JAVA_TOOL_OPTIONS","value":"-XX:-UseContainerSupport -Xmx512m -XX:ActiveProcessorCount=1"}]}]}}}}'

echo "Deleting Kafka pod (${KAFKA_POD_NAME}) to apply patch..."
kubectl delete pod ${KAFKA_POD_NAME} -n ${NAMESPACE} --ignore-not-found=true --wait=false

echo "Waiting for Kafka pod (${KAFKA_POD_NAME}) to become Ready..."
if ! kubectl wait --for=condition=Ready pod/${KAFKA_POD_NAME} --timeout=300s -n ${NAMESPACE}; then
    echo "ERROR: Kafka pod ${KAFKA_POD_NAME} failed to become Ready after patching StatefulSet."
    echo "Dumping Pod Logs:"
    kubectl logs pod/${KAFKA_POD_NAME} -n ${NAMESPACE} --tail=100 || echo "Could not get logs for ${KAFKA_POD_NAME}."
    echo "Describing Pod:"
    kubectl describe pod ${KAFKA_POD_NAME} -n ${NAMESPACE} || echo "Could not describe pod ${KAFKA_POD_NAME}."
    exit 1
fi
echo "Kafka pod ${KAFKA_POD_NAME} is Ready."

echo "Waiting for Zenko CR (${ZENKO_NAME}) to become Available..."

k_cmd="kubectl -n ${NAMESPACE} get zenko/${ZENKO_NAME}"
for i in $(seq 1 120); do
    conditions=$($k_cmd -o "jsonpath={.status.conditions}")
    if kubectl wait --for condition=Available --timeout 5s --namespace ${NAMESPACE} zenko/${ZENKO_NAME}; then
        break;
    fi
    # Debug log to ease understanding of failures in the CI
    kubectl get pods -A
done
