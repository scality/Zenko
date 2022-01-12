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
    local crd_dir="${ISO_ROOT}/operator/deploy/crds"
    local role_dir="${ISO_ROOT}/operator/deploy"
    local zenko_operator_repo='https://github.com/scality/zenko-operator'

    mkdir -p ${crd_dir} ${role_dir}

    kustomize build "${zenko_operator_repo}/config/artesca-solution/crd?ref=$(zenko_operator_tag)" > ${crd_dir}/zenko_crd.yaml
    kustomize build "${zenko_operator_repo}/config/artesca-solution/rbac?ref=$(zenko_operator_tag)" |
        docker run --rm -i ryane/kfilt:v0.0.5 -k Role,ClusterRole > ${role_dir}/role.yaml

    env $(dependencies_versions_env) envsubst < zenkoversion.yaml > ${ISO_ROOT}/zenkoversion.yaml
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

function copy_oci_image()
{
    IMAGE_NAME=${1##*/}
    FULL_PATH=${IMAGES_ROOT}/${IMAGE_NAME/:/\/}
    mkdir -p ${FULL_PATH}
    ${SKOPEO} ${SKOPEO_OPTS} copy \
        docker://${1} \
        dir:${FULL_PATH}

    # oras does not put a 'mediaType' in the manifest.json file
    # add it manually so the image is piked up by static-container-registry
    jq -c \
        '{schemaVersion, config, mediaType: "application/vnd.oci.image.manifest.v1+json", layers}' \
        ${FULL_PATH}/manifest.json > ${FULL_PATH}/new_manifest.json
    mv ${FULL_PATH}/new_manifest.json ${FULL_PATH}/manifest.json
}

# $1 : destination folder
# $2 : mime-type of the file
# $3 : optionally, name of the file
# input : the content of the file
# output : the manifest fragment defining the file
function generate_manifest_layer()
{
    local tmp=$(mktemp)
    cat > $tmp
    chmod +r $tmp
    digest=$(sha256sum  ${tmp} | cut -d " " -f 1) # get sha256, sha256sum prints the checksum and the filename, keep the checksum only
    size=$(stat --printf "%s" ${tmp})             # get only the size (in bytes) of the file. format "%s" only prints the size
    mv $tmp $1/$digest

    echo "{"
    echo "\"mediaType\": \"$2\","
    echo "\"digest\": \"sha256:${digest}\","
    echo "\"size\": ${size}"
    [ $# -eq 3 ] && echo ",\"annotations\": { \"org.opencontainers.image.title\": \"$3\" }"
    echo "}"
}

function generate_local_dashboard()
{
    if [[ $# -ne 1 ]]
    then
        echo "missing argument, $0 <path>"
        exit 1
    fi

    local dashboard="${1}/dashboard.json"
    local alert="${1}/alerts.yaml"

    local dashboard_base_dir=${IMAGES_ROOT}/${1##*/}-dashboard/${VERSION}/
    mkdir -p ${dashboard_base_dir}

    jq > ${dashboard_base_dir}/manifest.json <<EOF
{
    "schemaVersion": 2,
    "mediaType": "application/vnd.oci.image.manifest.v1+json",
    "config": $(generate_manifest_layer "${dashboard_base_dir}" "application/vnd.oci.image.config.v1+json" <<< '{}'),
    "layers": $(jq -s "." \
        <( [ -e "${dashboard}" ] && generate_manifest_layer "${dashboard_base_dir}" "application/grafana-dashboard+json" \
                                                            "$(basename "${dashboard}")" < "${dashboard}" ) \
        <( [ -e "${alert}" ] && generate_manifest_layer "${dashboard_base_dir}" "prometheus-alerts+yaml" \
                                                        "$(basename "${alert}")" < "${alert}" ) \
    )
}
EOF
}

function get_local_dashboards()
{
    find ${REPOSITORY_DIR}/monitoring/ -type d -depth 1 -print0 |
        while IFS= read -r -d '' dashboard ; do
            echo "Prepare dashboard: ${dashboard##*/}"
            generate_local_dashboard "${dashboard}"
        done
}

function get_component_dashboards()
{
    components=$(yq eval '.* | select(.dashboard != "") | .sourceRegistry + "/" + .dashboard + ":" + .tag' deps.yaml)

    for dashboard in ${components}
    do
        echo "copy dashboards/alerts for ${dashboard}"
        copy_oci_image ${dashboard}
    done
}

function get_dashboards()
{
    get_local_dashboards
    get_component_dashboards
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
        registry.scality.com/static-container-registry/static-container-registry:1.0.0 \
            python3 static_container_registry.py \
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
    copy_docker_image ${img}
done
get_dashboards
dedupe
build_registry_config
build_iso
echo DONE
