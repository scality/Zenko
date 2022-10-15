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

KUBEDB_SCRIPT_BRANCH_TAG=89fab34cf2f5d9e0bcc3c2d5b0f0599f94ff0dca

KUBEDB_OPERATOR_PATH=${ISO_ROOT}/deploy/kubedb.yaml
KUBEDB_CATALOGS_PATH=${ISO_ROOT}/deploy/kubedb-catalogs.yaml
MONGODB_SINGLE_NODE_PATH=${ISO_ROOT}/deploy/mongodb-1-node.yaml
MONGODB_THREE_NODE_PATH=${ISO_ROOT}/deploy/mongodb-3-nodes.yaml
MONGODB_SHARDED_SINGLE_NODE_PATH=${ISO_ROOT}/deploy/mongodb-sharded-1-node.yaml
MONGODB_SHARDED_THREE_NODE_PATH=${ISO_ROOT}/deploy/mongodb-sharded-3-nodes.yaml

SOLUTION_ENV='SOLUTION_ENV'

export KUBEDB_NAMESPACE=${SOLUTION_ENV}
export KUBEDB_SERVICE_ACCOUNT=kubedb-operator
export KUBEDB_IMAGE_NAME=operator
export KUBEDB_OPERATOR_NAME=kubedb-operator
export KUBEDB_CERT_NAME=kubedb-operator-apiserver-cert
export KUBEDB_DOCKER_REGISTRY=${SOLUTION_REGISTRY}
export KUBEDB_PRIORITY_CLASS=system-cluster-critical

MONGODB_NAME="mongodb"
MONGODB_SHARDED_NAME="data-db"
MONGODB_NAMESPACE=${SOLUTION_ENV}
MONGODB_REGISTRY=${SOLUTION_REGISTRY}
MONGODB_IMAGE_NAME="mongodb"
MONGODB_IMAGE_TAG=$(yq eval ".mongodb.tag" $SOLUTION_BASE_DIR/deps.yaml)
MONGODB_INIT_IMAGE_NAME="bitnami-shell"
MONGODB_INIT_IMAGE_TAG=$(yq eval ".mongodb-mongodb-shell.tag" $SOLUTION_BASE_DIR/deps.yaml)
MONGODB_EXPORTER_IMAGE_NAME="mongodb-exporter"
MONGODB_EXPORTER_IMAGE_TAG=$(yq eval ".mongodb-exporter.tag" $SOLUTION_BASE_DIR/deps.yaml)
MONGODB_SHARDED_IMAGE_NAME="mongodb-sharded"
MONGODB_SHARDED_IMAGE_TAG=$(yq eval ".mongodb-sharded.tag" $SOLUTION_BASE_DIR/deps.yaml)
MONGODB_SHARDED_EXPORTER_IMAGE_NAME="mongodb-exporter"
MONGODB_SHARDED_EXPORTER_IMAGE_TAG=$(yq eval ".mongodb-sharded-exporter.tag" $SOLUTION_BASE_DIR/deps.yaml)
MONGODB_SHARDED_SHELL_IMAGE_NAME="bitnami-shell"
MONGODB_SHARDED_SHELL_IMAGE_TAG=$(yq eval ".mongodb-shell.tag" $SOLUTION_BASE_DIR/deps.yaml)
MONGODB_STORAGE_CLASS="MONGODB_STORAGE_CLASS"

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

function kubedb_yamls()
{
    echo merging kubedb yamls
    operator_yamls=(
        certs
        operator
        service-account
        rbac-list
        user-roles
        appcatalog-user-roles
        validating-webhook
        mutating-webhook
        psp-operator
        psp-mongodb
        psp-redis
    )
    catalog_yamls=(
        kubedb-catalog-mongodb
        kubedb-catalog-redis
    )

    for y in "${operator_yamls[@]}"; do
        cat ${SOLUTION_BASE_DIR}/kubedb/${y}.yaml | envsubst >> ${KUBEDB_OPERATOR_PATH}
        echo --- >> ${KUBEDB_OPERATOR_PATH}
    done

    for y in "${catalog_yamls[@]}"; do
        cat ${SOLUTION_BASE_DIR}/kubedb/${y}.yaml | envsubst >> ${KUBEDB_CATALOGS_PATH}
        echo --- >> ${KUBEDB_CATALOGS_PATH}
    done
}

function render_mongodb_yamls()
{
    local OUTPUT_PATH=${1:-${OPERATOR_PATH}}
    local NODE_COUNT=${2:-1}
    local ADD_OPTIONS=${3:-""}

    echo creating mongodb ${NODE_COUNT}-node yamls
    CHART_PATH="$SOLUTION_BASE_DIR/mongodb/charts/mongodb"

    helm template ${MONGODB_NAME} ${CHART_PATH} -n ${MONGODB_NAMESPACE} \
        -f "${CHART_PATH}/custom-values.yaml" \
        --set "image.registry=${MONGODB_REGISTRY}" \
        --set "image.repository=${MONGODB_IMAGE_NAME}" \
        --set "image.tag=${MONGODB_IMAGE_TAG}" \
        --set "volumePermissions.image.registry=${MONGODB_REGISTRY}" \
        --set "volumePermissions.image.repository=${MONGODB_INIT_IMAGE_NAME}" \
        --set "volumePermissions.image.tag=${MONGODB_INIT_IMAGE_TAG}" \
        --set "metrics.image.registry=${MONGODB_REGISTRY}" \
        --set "metrics.image.repository=${MONGODB_EXPORTER_IMAGE_NAME}" \
        --set "metrics.image.tag=${MONGODB_EXPORTER_IMAGE_TAG}" \
        --set "persistence.storageClass=${MONGODB_STORAGE_CLASS}" \
        --set "existingSecret=${MONGODB_NAME}-db-creds" \
        --set "volumePermissions.enabled=true" \
        --set "replicaSet.enabled=true" \
        --set "${ADD_OPTIONS}" >> ${OUTPUT_PATH}
}

function mongodb_yamls()
{

    render_mongodb_yamls "${MONGODB_SINGLE_NODE_PATH}" 1 \
        "replicaSet.pdb.minAvailable.secondary=0,replicaSet.pdb.minAvailable.arbiter=0,replicaSet.replicas.secondary=0,replicaSet.replicas.arbiter=0" 

    render_mongodb_yamls "${MONGODB_THREE_NODE_PATH}" 3 \
        "replicaSet.pdb.minAvailable.secondary=1,replicaSet.pdb.minAvailable.arbiter=0,replicaSet.replicas.secondary=2,replicaSet.replicas.arbiter=0" 
}

function render_mongodb_sharded_yamls()
{
    local OUTPUT_PATH=${1:-${OPERATOR_PATH}}
    local SHARD_COUNT=${2:-1}
    local NODE_COUNT=${3:-1}
    local ADD_OPTIONS=${4:-""}

    echo creating mongodb-sharded ${NODE_COUNT}-node yamls
    CHART_PATH="$SOLUTION_BASE_DIR/mongodb/charts/mongodb-sharded"

    helm template ${MONGODB_SHARDED_NAME} ${CHART_PATH} -n ${MONGODB_NAMESPACE} \
        --set image.registry=${MONGODB_REGISTRY} \
        --set image.repository=${MONGODB_SHARDED_IMAGE_NAME} \
        --set image.tag=${MONGODB_SHARDED_IMAGE_TAG} \
        --set global.storageClass=${MONGODB_STORAGE_CLASS} \
        --set shards=${SHARD_COUNT} \
        --set mongos.replicas=${NODE_COUNT} \
        --set mongos.useStatefulSet=true \
        --set shardsvr.dataNode.replicas=${NODE_COUNT} \
        --set shardsvr.persistence.enabled=true \
        --set shardsvr.persistence.storageClass=${MONGODB_STORAGE_CLASS} \
        --set configsvr.replicas=${NODE_COUNT} \
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
        --set existingSecret=${MONGODB_NAME}-db-creds >> ${OUTPUT_PATH}
}

function mongodb_sharded_yamls()
{
    render_mongodb_sharded_yamls "${MONGODB_SHARDED_SINGLE_NODE_PATH}" 1 1
    render_mongodb_sharded_yamls "${MONGODB_SHARDED_THREE_NODE_PATH}" 1 3 
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
kubedb_yamls
mongodb_yamls
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
