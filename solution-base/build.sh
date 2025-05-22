#!/bin/bash
set -eu

SCRIPT_FULL_PATH=$(readlink -f "$0")
REPOSITORY_DIR=$(dirname "$SCRIPT_FULL_PATH")/..
SOLUTION_BASE_DIR=$REPOSITORY_DIR/solution-base

PWD=$(pwd)
BUILD_ROOT=${PWD}/_build
ISO_ROOT=${BUILD_ROOT}/root
IMAGES_ROOT=${ISO_ROOT}/images

PRODUCT_NAME=Zenko-Base
PRODUCT_LOWERNAME=zenko-base
BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BUILD_HOST=$(hostname)

VERSION_FILE="${REPOSITORY_DIR}/VERSION"

source "${VERSION_FILE}"
GIT_REVISION=$(git describe --long --always --tags --dirty)
ISO=${BUILD_ROOT}/${PRODUCT_LOWERNAME}-${VERSION_FULL}.iso

DOCKER=docker
DOCKER_OPTS=
DOCKER_SOCKET=${DOCKER_SOCKET:-unix:///var/run/docker.sock}
HARDLINK=hardlink
SKOPEO=skopeo
SKOPEO_OPTS="--override-os linux --insecure-policy"
SOLUTION_REGISTRY=metalk8s-registry-from-config.invalid/${PRODUCT_LOWERNAME}-${VERSION_FULL}

MONGODB_SHARDED_SINGLE_NODE_PATH=${ISO_ROOT}/deploy/mongodb-sharded-1-node.yaml
MONGODB_SHARDED_SINGLE_NODE_TWO_SHARDS_PATH=${ISO_ROOT}/deploy/mongodb-sharded-1-node-2-shards.yaml
MONGODB_SHARDED_THREE_NODE_PATH=${ISO_ROOT}/deploy/mongodb-sharded-3-nodes.yaml
MONGODB_SHARDED_THREE_NODE_THREE_SHARDS_PATH=${ISO_ROOT}/deploy/mongodb-sharded-3-nodes-3-shards.yaml
MONGODB_SHARDED_SIX_NODE_PATH=${ISO_ROOT}/deploy/mongodb-sharded-6-nodes.yaml
MONGODB_SHARDED_SIX_NODE_TWO_SHARDS_PATH=${ISO_ROOT}/deploy/mongodb-sharded-6-nodes-2-shards.yaml
MONGODB_SHARDED_SIX_NODE_SIX_SHARDS_PATH=${ISO_ROOT}/deploy/mongodb-sharded-6-nodes-6-shards.yaml
MONGODB_SHARDED_NINE_NODE_PATH=${ISO_ROOT}/deploy/mongodb-sharded-9-nodes.yaml
MONGODB_SHARDED_NINE_NODE_THREE_SHARDS_PATH=${ISO_ROOT}/deploy/mongodb-sharded-9-nodes-3-shards.yaml
MONGODB_SHARDED_NINE_NODE_NINE_SHARDS_PATH=${ISO_ROOT}/deploy/mongodb-sharded-9-nodes-9-shards.yaml
MONGODB_SHARDED_TWELVE_NODE_PATH=${ISO_ROOT}/deploy/mongodb-sharded-12-nodes.yaml
MONGODB_SHARDED_TWELVE_NODE_FOUR_SHARDS_PATH=${ISO_ROOT}/deploy/mongodb-sharded-12-nodes-4-shards.yaml
MONGODB_SHARDED_TWELVE_NODE_TWELVE_SHARDS_PATH=${ISO_ROOT}/deploy/mongodb-sharded-12-nodes-12-shards.yaml

SOLUTION_ENV='SOLUTION_ENV'

MONGODB_NAME="mongodb"
MONGODB_SHARDED_NAME="data-db"
MONGODB_NAMESPACE=${SOLUTION_ENV}
MONGODB_REGISTRY=${SOLUTION_REGISTRY}
MONGODB_SHARDED_IMAGE_NAME="mongodb-sharded"
MONGODB_SHARDED_IMAGE_TAG=$(yq eval ".mongodb-sharded.tag" $SOLUTION_BASE_DIR/deps.yaml)
MONGODB_SHARDED_EXPORTER_IMAGE_NAME="mongodb-exporter"
MONGODB_SHARDED_EXPORTER_IMAGE_TAG=$(yq eval ".mongodb-sharded-exporter.tag" $SOLUTION_BASE_DIR/deps.yaml)
MONGODB_SHARDED_SHELL_IMAGE_NAME=$(yq eval ".mongodb-shell.image" $SOLUTION_BASE_DIR/deps.yaml | awk -F'/' '{print $NF}')
MONGODB_SHARDED_SHELL_IMAGE_TAG=$(yq eval ".mongodb-shell.tag" $SOLUTION_BASE_DIR/deps.yaml)
MONGODB_STORAGE_CLASS="MONGODB_STORAGE_CLASS"
MONGODB_MONGOS_RAM_LIMIT="MONGODB_MONGOS_RAM_LIMIT"
MONGODB_SHARDSERVER_RAM_LIMIT="MONGODB_SHARDSERVER_RAM_LIMIT"
MONGODB_SHARDSERVER_EXTRA_FLAGS="MONGODB_SHARDSERVER_EXTRA_FLAGS"
MONGODB_SHARDSERVER_RAM_REQUEST="MONGODB_SHARDSERVER_RAM_REQUEST"
MONGODB_MONGOS_RAM_REQUEST="MONGODB_MONGOS_RAM_REQUEST"

function flatten_source_images()
{
    yq eval '.* | (.sourceRegistry // "docker.io") + "/" + .image + ":" + .tag' ${SOLUTION_BASE_DIR}/deps.yaml
}

function clean()
{
    echo cleaning
    rm -rf ${BUILD_ROOT}
}

function mkdirs()
{
    echo making dirs
    mkdir -p ${ISO_ROOT}/deploy
    mkdir -p ${IMAGES_ROOT}
}

function render_mongodb_sharded_yamls()
{
    local OUTPUT_PATH=${1:-${OPERATOR_PATH}}
    local SHARD_COUNT=${2:-1}
    local NODE_COUNT=${3:-1}
    local DATA_REPLICA_COUNT=${4:-1}

    echo creating mongodb-sharded ${NODE_COUNT}-node yamls
    CHART_PATH="$SOLUTION_BASE_DIR/mongodb/charts/mongodb-sharded"

    helm template ${MONGODB_SHARDED_NAME} ${CHART_PATH} -n ${MONGODB_NAMESPACE} \
        --set image.registry=${MONGODB_REGISTRY} \
        --set image.repository=${MONGODB_SHARDED_IMAGE_NAME} \
        --set image.tag=${MONGODB_SHARDED_IMAGE_TAG} \
        --set global.storageClass=${MONGODB_STORAGE_CLASS} \
        --set shards=${SHARD_COUNT} \
        --set mongos.replicaCount=${NODE_COUNT} \
        --set mongos.useStatefulSet=true \
        --set shardsvr.dataNode.replicaCount=${DATA_REPLICA_COUNT} \
        --set shardsvr.persistence.enabled=true \
        --set shardsvr.persistence.storageClass=${MONGODB_STORAGE_CLASS} \
        --set configsvr.replicaCount=$(( $NODE_COUNT > 2 ? 3 : 1 )) \
        --set configsvr.persistence.enabled=true \
        --set configsvr.persistence.storageClass=${MONGODB_STORAGE_CLASS} \
        --set metrics.enabled=true \
        --set metrics.podMonitor.enabled=true \
        --set metrics.podMonitor.namespace= \
        --set metrics.podMonitor.additionalLabels."metalk8s\.scality\.com/monitor"= \
        --set common.initScriptsCM=mongodb-sharded-init-scripts \
        --set volumePermissions.enabled=true \
        --set metrics.image.registry=${MONGODB_REGISTRY} \
        --set metrics.image.repository=${MONGODB_SHARDED_EXPORTER_IMAGE_NAME} \
        --set metrics.image.tag=${MONGODB_SHARDED_EXPORTER_IMAGE_TAG} \
        --set volumePermissions.image.registry=${MONGODB_REGISTRY} \
        --set volumePermissions.image.repository=${MONGODB_SHARDED_SHELL_IMAGE_NAME} \
        --set volumePermissions.image.tag=${MONGODB_SHARDED_SHELL_IMAGE_TAG} \
        --set 'shardsvr.persistence.selector.matchLabels.app\.kubernetes\.io/name=mongodb' \
        --set 'shardsvr.persistence.selector.matchLabels.app\.kubernetes\.io/part-of=zenko' \
        --set 'configsvr.persistence.selector.matchLabels.app\.kubernetes\.io/name=mongodb-sharded-config' \
        --set 'configsvr.persistence.selector.matchLabels.app\.kubernetes\.io/part-of=zenko' \
        --set "configsvr.mongodbExtraFlags={--setParameter rollbackTimeLimitSecs=259200}" \
        --set mongos.resources.requests.memory=${MONGODB_MONGOS_RAM_REQUEST} \
        --set mongos.resources.limits.memory=${MONGODB_MONGOS_RAM_LIMIT} \
        --set "shardsvr.dataNode.mongodbExtraFlags={${MONGODB_SHARDSERVER_EXTRA_FLAGS}}" \
        --set shardsvr.dataNode.resources.limits.memory=${MONGODB_SHARDSERVER_RAM_LIMIT} \
        --set shardsvr.dataNode.resources.requests.memory=${MONGODB_SHARDSERVER_RAM_REQUEST} \
        --set existingSecret=${MONGODB_NAME}-db-creds >> ${OUTPUT_PATH} \
        --set auth.existingSecret=${MONGODB_NAME}-db-creds \
        --set common.serviceAccount.create=false \
        --set configsvr.serviceAccount.create=false \
        --set mongos.serviceAccount.create=false \
        --set shardsvr.dataNode.serviceAccount.create=false \
        --set shardsvr.arbiter.serviceAccount.create=false \
        --set 'configsvr.extraEnvVars[0].name=MONGODB_APP_USERNAME' \
        --set 'configsvr.extraEnvVars[0].valueFrom.secretKeyRef.name=mongodb-db-creds' \
        --set 'configsvr.extraEnvVars[0].valueFrom.secretKeyRef.key=mongodb-username' \
        --set 'configsvr.extraEnvVars[1].name=MONGODB_APP_DATABASE' \
        --set 'configsvr.extraEnvVars[1].valueFrom.secretKeyRef.name=mongodb-db-creds' \
        --set 'configsvr.extraEnvVars[1].valueFrom.secretKeyRef.key=mongodb-database' \
        --set 'configsvr.extraEnvVars[2].name=MONGODB_APP_PASSWORD' \
        --set 'configsvr.extraEnvVars[2].valueFrom.secretKeyRef.name=mongodb-db-creds' \
        --set 'configsvr.extraEnvVars[2].valueFrom.secretKeyRef.key=mongodb-password' \
        --set 'shardsvr.dataNode.extraEnvVars[0].name=MONGODB_APP_USERNAME' \
        --set 'shardsvr.dataNode.extraEnvVars[0].valueFrom.secretKeyRef.name=mongodb-db-creds' \
        --set 'shardsvr.dataNode.extraEnvVars[0].valueFrom.secretKeyRef.key=mongodb-username' \
        --set 'shardsvr.dataNode.extraEnvVars[1].name=MONGODB_APP_DATABASE' \
        --set 'shardsvr.dataNode.extraEnvVars[1].valueFrom.secretKeyRef.name=mongodb-db-creds' \
        --set 'shardsvr.dataNode.extraEnvVars[1].valueFrom.secretKeyRef.key=mongodb-database' \
        --set 'shardsvr.dataNode.extraEnvVars[2].name=MONGODB_APP_PASSWORD' \
        --set 'shardsvr.dataNode.extraEnvVars[2].valueFrom.secretKeyRef.name=mongodb-db-creds' \
        --set 'shardsvr.dataNode.extraEnvVars[2].valueFrom.secretKeyRef.key=mongodb-password'
}

function mongodb_sharded_yamls()
{
    # For now we maximize the number of replicas to 3, so each shard is a P-S-S
    # Parameters are: shard count - node count - data replica count
    render_mongodb_sharded_yamls "${MONGODB_SHARDED_SINGLE_NODE_PATH}" 1 1 1
    render_mongodb_sharded_yamls "${MONGODB_SHARDED_SINGLE_NODE_TWO_SHARDS_PATH}" 2 1 1
    render_mongodb_sharded_yamls "${MONGODB_SHARDED_THREE_NODE_PATH}" 1 3 3
    render_mongodb_sharded_yamls "${MONGODB_SHARDED_THREE_NODE_THREE_SHARDS_PATH}" 3 3 3
    render_mongodb_sharded_yamls "${MONGODB_SHARDED_SIX_NODE_PATH}" 1 6 3
    render_mongodb_sharded_yamls "${MONGODB_SHARDED_SIX_NODE_TWO_SHARDS_PATH}" 2 6 3
    render_mongodb_sharded_yamls "${MONGODB_SHARDED_SIX_NODE_SIX_SHARDS_PATH}" 6 6 3
    render_mongodb_sharded_yamls "${MONGODB_SHARDED_NINE_NODE_PATH}" 1 9 3
    render_mongodb_sharded_yamls "${MONGODB_SHARDED_NINE_NODE_THREE_SHARDS_PATH}" 3 9 3
    render_mongodb_sharded_yamls "${MONGODB_SHARDED_NINE_NODE_NINE_SHARDS_PATH}" 9 9 3
    render_mongodb_sharded_yamls "${MONGODB_SHARDED_TWELVE_NODE_PATH}" 1 12 3
    render_mongodb_sharded_yamls "${MONGODB_SHARDED_TWELVE_NODE_FOUR_SHARDS_PATH}" 4 12 3
    render_mongodb_sharded_yamls "${MONGODB_SHARDED_TWELVE_NODE_TWELVE_SHARDS_PATH}" 12 12 3
}

function gen_manifest_yaml()
{
    cat > ${ISO_ROOT}/manifest.yaml <<EOF
apiVersion: solutions.metalk8s.scality.com/v1alpha1
kind: Solution
metadata:
  annotations:
    solutions.metalk8s.scality.com/display-name: ${PRODUCT_NAME}
    solutions.metalk8s.scality.com/git: ${GIT_REVISION}
    solutions.metalk8s.scality.com/development-release: true
    solutions.metalk8s.scality.com/build-timestamp: ${BUILD_TIMESTAMP}
    solutions.metalk8s.scality.com/build-host: ${BUILD_HOST}
  name: ${PRODUCT_LOWERNAME}
spec:
  version: ${VERSION_FULL}
EOF
}

function copy_docker_image()
{
    IMAGE_NAME=${1##*/}
    FULL_PATH=${IMAGES_ROOT}/${IMAGE_NAME/:/\/}
    mkdir -p ${FULL_PATH}
    ${SKOPEO} ${SKOPEO_OPTS} copy \
        --format v2s2 --dest-compress \
        docker://${1} \
        dir:${FULL_PATH}
}

function dedupe()
{
    ${HARDLINK} -c ${IMAGES_ROOT}
}

function build_registry_config()
{
    docker run \
        --name static-oci-registry \
        --mount type=bind,source=${ISO_ROOT}/images,destination=/var/lib/images \
        --mount type=bind,source=${ISO_ROOT},destination=/var/run \
        --rm \
        docker.io/nicolast/static-container-registry:latest \
            python3 static-container-registry.py \
            --name-prefix '{{ repository }}' \
            --server-root '{{ registry_root }}' \
            --omit-constants \
            /var/lib/images > ${ISO_ROOT}/registry-config.inc.j2
    rm ${ISO_ROOT}/static-container-registry.conf -f
}

function build_iso()
{
    mkisofs -output ${ISO} \
        -quiet \
        -rock \
        -joliet \
        -joliet-long \
        -full-iso9660-filenames \
        -volid "${PRODUCT_NAME} ${VERSION_FULL}" \
        --iso-level 3 \
        -gid 0 \
        -uid 0 \
        -input-charset iso8859-1 \
        -output-charset iso8859-1 \
        ${ISO_ROOT}
    echo Implant MD5 sum into ISO
    implantisomd5 --supported-iso ${ISO}
    sha256sum ${ISO} > ${ISO_ROOT}/SHA256SUM
    echo ISO File at ${ISO}
    echo SHA256 for ISO:
    cat ${ISO_ROOT}/SHA256SUM
}

MANIFEST_ONLY=${MANIFEST_ONLY:-'false'}

# run everything in order
clean
mkdirs
mongodb_sharded_yamls
gen_manifest_yaml

if  [ $MANIFEST_ONLY = 'false' ]; then
    flatten_source_images | while read img ; do
        # only pull if the image isnt already local
        ${DOCKER} image inspect ${img} > /dev/null 2>&1 || ${DOCKER} ${DOCKER_OPTS} pull ${img}
        copy_docker_image ${img}
    done
    dedupe
    build_registry_config
    build_iso
fi
echo DONE
