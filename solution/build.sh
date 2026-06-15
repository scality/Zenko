#!/usr/bin/env bash

set -e
set -u

if  [ "$(uname -s)" = "Darwin" ]; then
    for cmd in gsed gstat gtar ; do
        if ! command -v $cmd &> /dev/null; then
            echo "Please install $cmd. You can do this via 'brew install $cmd'"
            exit 1
        fi
    done

    sed() { gsed "$@" ; }
    stat() { gstat "$@" ; }
    tar() { gtar "$@" ; }

    export -f sed tar stat
fi

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

HARDLINK=hardlink
command -v $HARDLINK >/dev/null 2>&1 || HARDLINK="$(brew --prefix util-linux)/bin/hardlink"

DOCKER=docker
DOCKER_OPTS="--platform linux/amd64"
SKOPEO=skopeo
SKOPEO_OPTS="--override-os linux --override-arch amd64 --insecure-policy"

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
    source <( ${REPOSITORY_DIR}/solution/kafka_build_vars.sh )
    source <( ${REPOSITORY_DIR}/solution/analytics_bootstrap_build_vars.sh )

    yq eval '.* | select(.image) | (.sourceRegistry // "docker.io") + "/" + .image + ":" + .tag' deps.yaml |
        sed '/ghcr.io\/scality\/zenko\/kafka/ s/$/-'"${BUILD_TREE_HASH}"'/' |
        sed '/ghcr.io\/scality\/zenko\/analytics-bootstrap/ s/$/-'"${ANALYTICS_BOOTSTRAP_BUILD_TREE_HASH}"'/'
}

function zenko_operator_tag()
{
    yq eval '.zenko-operator.tag' deps.yaml
}

function dependencies_versions_env()
{
    yq eval '.[] | select(.image)     | .envsubst + "=" + .image     | sub("_TAG=", "_IMAGE=")' deps.yaml
    yq eval '.[] | select(.dashboard) | .envsubst + "=" + .dashboard | sub("_TAG=.*/", "_DASHBOARD=")' deps.yaml
    yq eval '.[] | select(.policy)    | .envsubst + "=" + .policy | sub("_TAG=.*/", "_POLICY=")' deps.yaml
    find ${REPOSITORY_DIR}/monitoring/ -mindepth 1 -maxdepth 1 -type d -print0 | while IFS= read -r -d '' folder ; do
        local dashboard="${folder##*/}"
        echo "$(tr a-z- A-Z_ <<< $dashboard)_DASHBOARD=${dashboard}-dashboard"
    done
    yq eval '.[] | select(.tag)       | .envsubst + "=" + .tag' deps.yaml
    echo ZENKO_VERSION_NAME=${VERSION_FULL}

    source <( "${REPOSITORY_DIR}/solution/kafka_build_vars.sh" )
    echo "KAFKA_BUILD_TREE_HASH=${BUILD_TREE_HASH}"
    source <( "${REPOSITORY_DIR}/solution/analytics_bootstrap_build_vars.sh" )
    echo "ANALYTICS_BOOTSTRAP_BUILD_TREE_HASH=${ANALYTICS_BOOTSTRAP_BUILD_TREE_HASH}"
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
        docker run ${DOCKER_OPTS} --rm -i ryane/kfilt:v0.0.5 -k Role,ClusterRole > ${deploy_dir}/role.yaml

    env $(dependencies_versions_env) envsubst < zenkoversion.yaml > ${ISO_ROOT}/zenkoversion.yaml

    # ignoring errors here as webhooks are only available starting from zenko-operator 1.6.0
    kustomize build "${zenko_operator_repo}/config/artesca-solution/webhooks?ref=$(zenko_operator_tag)" -o ${deploy_dir}/webhooks.yaml || true
}

function copy_docker_image()
{
    IMAGE_NAME=${1##*/}
    IMAGE_TRANSPORT=${2:-docker-daemon:}
    FULL_PATH=${IMAGES_ROOT}/${IMAGE_NAME/:/\/}
    mkdir -p ${FULL_PATH}
    ${SKOPEO} ${SKOPEO_OPTS} copy \
        --format v2s2 --dest-compress \
        --src-daemon-host ${DOCKER_SOCKET:-unix:///var/run/docker.sock} \
        ${IMAGE_TRANSPORT}${1} \
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

    local component_name="${1##*/}"
    local dashboard_base_dir="${IMAGES_ROOT}/${component_name}-dashboard/${VERSION_FULL}/"
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
    components=$(yq eval '.* | select(.dashboard) | .sourceRegistry + "/" + .dashboard + ":" + .tag' deps.yaml)

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
    components=$(yq eval '.* | select(.policy) | .sourceRegistry + "/" + .policy + ":" + .tag' deps.yaml)

    for policy in ${components}
    do
        echo "copy iam policies for ${policy}"
        copy_oci_image ${policy}
    done

}

function copy_config()
{
    components=$(yq eval '.* | select(.config) | .sourceRegistry + "/" + .config + ":" + .tag' deps.yaml)

    for config in ${components}
    do
        echo "copy configs for ${config}"
        copy_oci_image ${config}
    done

}

function dedupe()
{
    ${HARDLINK} -c ${IMAGES_ROOT}
}

function validate_registry()
{
    echo "Validating ISO registry completeness against zenkoversion.yaml..."
    local missing=0

    while IFS= read -r image_ref ; do
        local image="${image_ref%:*}"
        local tag="${image_ref##*:}"
        local manifest="${IMAGES_ROOT}/${image}/${tag}/manifest.json"
        if [ ! -f "${manifest}" ] ; then
            echo "::error::Missing image in ISO registry: ${image}:${tag}"
            missing=$((missing + 1))
        fi
    done < <(yq eval '.. | select(.image and .tag) | .image + ":" + .tag' ${ISO_ROOT}/zenkoversion.yaml | sort -u)

    if [ ${missing} -gt 0 ] ; then
        echo "::error::${missing} image(s) referenced in zenkoversion.yaml are missing from the ISO registry. Aborting."
        exit 1
    fi
    echo "Registry validation passed: all images are present."
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
    rm -f ${ISO_ROOT}/static-container-registry.conf
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
    yq eval '.[] | select(.toolUrl) | .toolUrl + " " + .tag + " " + .toolName + " " + .envsubst' deps.yaml |\
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
    yq eval '.[] | select(.toolName and (has("toolUrl")|not)) | .sourceRegistry + "/" + .image + ":" + .tag + " " + .toolName' deps.yaml |\
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
    ${DOCKER} image inspect ${img} > /dev/null 2>&1 || ${DOCKER} pull ${DOCKER_OPTS} ${img}
    copy_docker_image ${img}
done
get_dashboards
copy_iam_policies
copy_config
validate_registry
dedupe
build_registry_config
build_iso
echo DONE
