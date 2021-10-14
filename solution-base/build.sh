#!/bin/bash
set -eu

PWD=$(pwd)
BUILD_ROOT=${PWD}/_build
ISO_ROOT=${BUILD_ROOT}/root
IMAGES_ROOT=${ISO_ROOT}/images

PRODUCT_NAME=Zenko-Base
PRODUCT_LOWERNAME=zenko-base
BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BUILD_HOST=$(hostname)
SCRIPT_FULL_PATH=$(readlink -f "$0")
REPOSITORY_DIR=$(dirname "$SCRIPT_FULL_PATH")/..


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
MONGODB_THREE_NODE_PATH=${ISO_ROOT}/deploy/mongodb-3-node.yaml

SOLUTION_ENV='SOLUTION_ENV'

export KUBEDB_OPERATOR_TAG=$(grep kubedb/operator: deps.txt | awk -F ':' '{print $2}')
export KUBEDB_NAMESPACE=${SOLUTION_ENV}
export KUBEDB_SERVICE_ACCOUNT=kubedb-operator
export KUBEDB_IMAGE_NAME=operator
export KUBEDB_OPERATOR_NAME=kubedb-operator
export KUBEDB_CERT_NAME=kubedb-operator-apiserver-cert
export KUBEDB_DOCKER_REGISTRY=${SOLUTION_REGISTRY}
export KUBEDB_PRIORITY_CLASS=system-cluster-critical

MONGODB_NAME="mongodb"
MONGODB_NAMESPACE=${SOLUTION_ENV}
MONGODB_REGISTRY=${SOLUTION_REGISTRY}
MONGODB_IMAGE_NAME="mongodb"
MONGODB_IMAGE_TAG=$(grep /mongodb: deps.txt | awk -F ':' '{print $2}')
MONGODB_INIT_IMAGE_NAME="minideb"
MONGODB_INIT_IMAGE_TAG=$(grep /minideb: deps.txt | awk -F ':' '{print $2}')
MONGODB_EXPORTER_IMAGE_NAME="mongodb-exporter"
MONGODB_EXPORTER_IMAGE_TAG=$(grep /mongodb-exporter: deps.txt | awk -F ':' '{print $2}')
MONGODB_STORAGE_CLASS="MONGODB_STORAGE_CLASS"

# grab our dependencies from our deps.txt file as an array
readarray -t DEP_IMAGES < deps.txt

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
        cat kubedb/${y}.yaml | envsubst >> ${KUBEDB_OPERATOR_PATH}
        echo --- >> ${KUBEDB_OPERATOR_PATH}
    done

    for y in "${catalog_yamls[@]}"; do
        cat kubedb/${y}.yaml | envsubst >> ${KUBEDB_CATALOGS_PATH}
        echo --- >> ${KUBEDB_CATALOGS_PATH}
    done
}

function render_mongodb_yamls()
{
    OUTPUT_PATH=${1:-${OPERATOR_PATH}}
    NODE_COUNT=${2:-1}
    ADD_OPTIONS=${3:-""}

    echo creating mongodb ${NODE_COUNT}-node yamls
    CHART_PATH="$(dirname $0)/mongodb/charts/mongodb"

    helm template ${MONGODB_NAME} ${CHART_PATH} -n ${MONGODB_NAMESPACE} \
        -f "${CHART_PATH}/custom-values.yaml" \
        --set "image.registry=${MONGODB_REGISTRY}" \
        --set "image.repository=${MONGODB_IMAGE_NAME}" \
        --set "image.tag=${MONGODB_IMAGE_TAG}" \
        --set "volumePermission.image.registry=${MONGODB_REGISTRY}" \
        --set "volumePermission.image.repository=${MONGODB_INIT_IMAGE_NAME}" \
        --set "volumePermission.image.tag=${MONGODB_INIT_IMAGE_TAG}" \
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

function copy_image()
{
    IMAGE_NAME=${1##*/}
    FULL_PATH=${IMAGES_ROOT}/${IMAGE_NAME/:/\/}
    mkdir -p ${FULL_PATH}
    ${SKOPEO} ${SKOPEO_OPTS} copy \
        --format v2s2 --dest-compress \
        --src-daemon-host ${DOCKER_SOCKET} \
        docker-daemon:${1} \
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

# run everything in order
clean
mkdirs
kubedb_yamls
mongodb_yamls
gen_manifest_yaml
for img in "${DEP_IMAGES[@]}"; do
    # only pull if the image isnt already local
    echo downloading ${img}
    ${DOCKER} image inspect ${img} > /dev/null 2>&1 || ${DOCKER} ${DOCKER_OPTS} pull ${img}
    copy_image ${img}
done
dedupe
build_registry_config
build_iso
echo DONE
