#!/bin/bash
set -e
set -u

PWD=$(pwd)
BUILD_ROOT=${PWD}/_build
ISO_ROOT=${BUILD_ROOT}/root
IMAGES_ROOT=${ISO_ROOT}/images
SCRIPT_FULL_PATH=$(readlink -f "$0")
REPOSITORY_DIR=$(dirname "${SCRIPT_FULL_PATH}")/..

PRODUCT_NAME=Zenko
PRODUCT_LOWERNAME=zenko
BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BUILD_HOST=$(hostname)

VERSION_FILE="${REPOSITORY_DIR}/VERSION"

source ${VERSION_FILE}
GIT_REVISION=$(git describe --long --always --tags --dirty)
ISO=${BUILD_ROOT}/${PRODUCT_LOWERNAME}-${VERSION_FULL}.iso

DOCKER=docker
DOCKER_OPTS=
DOCKER_SOCKET=${DOCKER_SOCKET:-unix:///var/run/docker.sock}
HARDLINK=hardlink
OPERATOR_SDK=operator-sdk
OPERATOR_SDK_OPTS=
SKOPEO=skopeo
SKOPEO_OPTS="--override-os linux --insecure-policy"

export SOLUTION_REGISTRY=metalk8s-registry-from-config.invalid/${PRODUCT_LOWERNAME}-${VERSION_FULL}

function clean()
{
    rm -rf ${BUILD_ROOT}
}

function mkdirs()
{
    mkdir -p ${ISO_ROOT}
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
  operator:
    image:
      name: zenko-operator
      tag: '$(zenko_operator_tag)'
EOF
}

function flatten_source_images()
{
    yq eval '.* | (.sourceRegistry // "docker.io") + "/" + .image + ":" + .tag' deps.yaml
}

function zenko_operator_tag()
{
    yq eval '.zenko-operator.tag' deps.yaml
}

function dependencies_versions_env()
{
    yq eval '.[] | .envsubst + "=" + .tag' deps.yaml
    echo VERSION_FULL=${VERSION_FULL}
}

function copy_yamls()
{
    cp -R -f operator/ ${ISO_ROOT}/operator
    env $(dependencies_versions_env) envsubst < zenkoversion.yaml > ${ISO_ROOT}/zenkoversion.yaml
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
gen_manifest_yaml
copy_yamls
flatten_source_images | while read img ; do
    # only pull if the image isnt already local
    ${DOCKER} image inspect ${img} > /dev/null 2>&1 || ${DOCKER} ${DOCKER_OPTS} pull ${img}
    copy_image ${img}
done
dedupe
build_registry_config
build_iso
echo DONE
