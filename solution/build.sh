#!/usr/bin/env bash

set -e
set -u

PWD=$(pwd)
BUILD_ROOT=${PWD}/_build
ISO_ROOT=${BUILD_ROOT}/root
ISO_BINDIR=${ISO_ROOT}/bin
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
    mkdir -p ${ISO_BINDIR}
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
    local deploy_dir="${ISO_ROOT}/operator/deploy"
    local crd_dir="${ISO_ROOT}/operator/deploy/crds"
    local zenko_operator_repo='https://github.com/scality/zenko-operator'

    mkdir -p ${deploy_dir} ${crd_dir}

    kustomize build "${zenko_operator_repo}/config/artesca-solution/crd?ref=$(zenko_operator_tag)" -o ${crd_dir}
    for file in ${crd_dir}/*.yaml ; do 
        mv $file ${file%.yaml}_crd.yaml
    done
    kustomize build "${zenko_operator_repo}/config/artesca-solution/rbac?ref=$(zenko_operator_tag)" |
        docker run --rm -i ryane/kfilt:v0.0.5 -k Role,ClusterRole > ${deploy_dir}/role.yaml

    env $(dependencies_versions_env) envsubst < zenkoversion.yaml > ${ISO_ROOT}/zenkoversion.yaml

    # ignoring errors here as webhooks are only available starting from zenko-operator 1.6.0
    kustomize build "${zenko_operator_repo}/config/artesca-solution/webhooks?ref=$(zenko_operator_tag)" -o ${deploy_dir}/webhooks.yaml || true
}

function copy_docker_image()
{
    IMAGE_NAME=${1##*/}
    IMAGE_TRANSPORT=${2:-docker://}
    FULL_PATH=${IMAGES_ROOT}/${IMAGE_NAME/:/\/}
    mkdir -p ${FULL_PATH}
    ${SKOPEO} ${SKOPEO_OPTS} copy \
        --format v2s2 --dest-compress \
        --src-daemon-host ${DOCKER_SOCKET:-unix:///var/run/docker.sock} \
        ${IMAGE_TRANSPORT}${1} \
        dir:${FULL_PATH}
}

function build_image()
{
    local path="${1##*/}"
    local image="$1:$2"
    shift 2

    local argumentNames
    argumentNames="$(sed -n 's/ARG \([^=]*\).*/\1/p' "$path/Dockerfile" | sort -u)"

    local -a buildArgs
    readarray -t buildArgs < <(
        {
            yq eval '.[] | .envsubst + "=" + .tag' deps.yaml ;
            yq eval '.[] | .envsubst + "=" + (.sourceRegistry // "docker.io") + "/" + .image' deps.yaml |
                sed 's/_TAG=/_IMAGE=/g'
        } | grep -F "$argumentNames" | sed 's/\(.*\)/--build-arg\n\1/'
    )

    # Work around bad expansion of empty array in bash 4.4- (c.f. https://stackoverflow.com/a/7577209)
    docker build -t "$image" ${buildArgs[@]+"${buildArgs[@]}"} "$@" "$path/"
    copy_docker_image "$image" 'docker-daemon:'
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

    local component_name="${1##*/}"
    local dashboard_base_dir="${IMAGES_ROOT}/${component_name}-dashboard/${VERSION}/"
    mkdir -p "${dashboard_base_dir}"

    jq > "${dashboard_base_dir}/manifest.json" <<EOF
{
    "schemaVersion": 2,
    "mediaType": "application/vnd.oci.image.manifest.v1+json",
    "config": $(generate_manifest_layer "${dashboard_base_dir}" "application/vnd.oci.image.config.v1+json" <<< '{}'),
    "layers": $(jq -s "." \
        <( [ -e "${dashboard}" ] && generate_manifest_layer "${dashboard_base_dir}" "application/grafana-dashboard+json" \
                                                            "${component_name}-dashboard.json" < "${dashboard}" ) \
        <( [ -e "${alert}" ] && generate_manifest_layer "${dashboard_base_dir}" "application/prometheus-alerts+yaml" \
                                                        "${component_name}-alerts.yaml" < "${alert}" ) \
    )
}
EOF
}

function get_local_dashboards()
{
    find ${REPOSITORY_DIR}/monitoring/ -mindepth 1 -maxdepth 1 -type d -print0 |
        while IFS= read -r -d '' dashboard ; do
            echo "Prepare dashboard: ${dashboard##*/}"
            generate_local_dashboard "${dashboard}"
        done
}

function get_component_dashboards()
{
    components=$(yq eval '.* | select(has("dashboard")) | .sourceRegistry + "/" + .dashboard + ":" + .tag' deps.yaml)

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

function copy_iam_policies()
{
    components=$(yq eval '.* | select(has("policy")) | .sourceRegistry + "/" + .policy + ":" + .tag' deps.yaml)

    for policy in ${components}
    do
        echo "copy iam policies for ${policy}"
        copy_oci_image ${policy}
    done

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
        ghcr.io/scality/static-container-registry:1.0.0 \
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

function download_tools()
{
    # Download every tool
    yq eval '.[] | select(has("toolUrl")) | .toolUrl + " " + .tag + " " + .toolName + " " + .envsubst' deps.yaml |\
    while read -r url tag toolName envsubst; do
    (
        url="$(env "$envsubst=$tag" envsubst "\$$envsubst" <<< "$url")"
        filename=${url##*/}

        cd "${BUILD_ROOT}"
        curl -LO "$url"

        # Flag to flatten the directory structure of tarballs, when needed
        FLATTEN=--transform='s/.*\///g'

        case "$filename" in
        *.tar.gz) tar $FLATTEN -zvxf "${filename}" -C "${ISO_BINDIR}" "${toolName}";;
        *.tar.bz) tar $FLATTEN -jvxf "${filename}" -C "${ISO_BINDIR}" "${toolName}";;
        *.tar)    tar $FLATTEN -vxf "${filename}" -C "${ISO_BINDIR}" "${toolName}";;
        *)        cp "${filename}" "${ISO_BINDIR}/${toolName}" ;;
        esac
    )
    done

    # Extract tools from images
    yq eval '.[] | select(has("toolName") and (has("toolUrl")|not)) | .sourceRegistry + "/" + .image + ":" + .tag + " " + .toolName' deps.yaml |\
    while read -r image toolName; do
        local container
        container=$(docker create $image $toolName)
        docker cp "$container:$toolName" ${ISO_BINDIR}/
        docker rm "$container"
    done
}

# run everything in order
clean
mkdirs
download_tools
gen_manifest_yaml
copy_yamls
flatten_source_images | while read img ; do
    # only pull if the image isnt already local
    ${DOCKER} image inspect ${img} > /dev/null 2>&1 || ${DOCKER} ${DOCKER_OPTS} pull ${img}
    copy_docker_image ${img}
done
get_dashboards
copy_iam_policies
dedupe
build_registry_config
build_iso
echo DONE
