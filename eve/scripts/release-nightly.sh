#!/bin/bash

set -e

# This function check the commit ref on a specified branch
# and returns a short commit revision
get_short_rev() {
  local url="$1"
  local branch="$2"

  echo $(git ls-remote $url --branch $branch | cut -c -7) 
}

usage() {
  local exitcode=$1
  cat <<HELP
    Usage: $0 [options]

      --cloudserver-revision <git revision>: The desired git revision of cloudserver.
        i.e: development/8.1, or a commit sha1.
      --backbeat-revision <git revision>: The desired git revision of backbeat.
        i.e: development/8.1, or a commit sha1.
      --dest <path>: The local path to save the chart.
        default: /tmp
      --upload <repo>: The name of the chart repository where we will upload the release.
        i.e: zenko
      --nightly-suffix <name>: the suffix of the chart version.
        default: nightly
      --help: Display this message.
HELP

  exit ${exitcode}
}

parse_semver() {
  local RE='[^0-9]*\([0-9]*\)\.\([0-9]*\)\.\([0-9]*\)[-+]\([0-9A-Za-z\-\.]*\)'
  local major
  local minor
  local patch
  local special

  major=`echo $1 | sed -n "s/${RE}/\1/p"`
  minor=`echo $1 | sed -n "s/${RE}/\2/p"`
  patch=`echo $1 | sed -n "s/${RE}/\3/p"`
  special=`echo $1 | sed -n "s/${RE}/\4/p"`

  SEMVER=( ${major} ${minor} ${patch} ${special} )
}

check_requirements() {
  HELM_VERSION=$(helm version --client --short)
  echo "Checking helm version: ${HELM_VERSION}"
  parse_semver "${HELM_VERSION}"
  # As we're using the option --set on helm package
  # which was only introduced in helm version >= 3.0.0
  # we need to ensure that we're not using an old version of helm.
  if [[ "${SEMVER[0]}" != "3" ]]; then
    echo "Helm must be >= 3.0.0 due to required features to use this script"
    exit 1
  fi
  if [ ${UPLOAD} ] && [[ ! -f /usr/bin/curl ]]; then
    echo "You must install curl to be able to upload charts"
    exit 1
  fi
  if [[ ! -f /usr/bin/git ]]; then
    echo "Git must be installed"
    exit 1
  fi
}

parse_opts() {
  local SCRIPT_FULL_PATH=$(readlink -f $0)

  declare -r LONG_OPTS='
    backbeat-revision:,
    cloudserver-revision:,
    dest:,
    upload:,
    nightly-suffix:,
    help,'

  OPTS=$(getopt -n "$0" -o "h" --long "$LONG_OPTS" -- "$@") || exit 1

  BACKBEAT_VERSION=""
  CLOUDSERVER_VERSION=""
  NIGHTLY_SUFFIX="nightly"
  DEST="/tmp/"
  GITHUB_URL="https://github.com"
  BACKBEAT_REPO_URL="${GITHUB_URL}/scality/backbeat.git"
  CLOUDSERVER_REPO_URL="${GITHUB_URL}/scality/cloudserver.git"
  CHART_PATH="$(dirname ${SCRIPT_FULL_PATH})/../../kubernetes/zenko"
  REGISTRY="registry.scality.com"
  REPOSITORY="zenko"
  UPLOAD=""

  eval set -- "${OPTS}"

  while true; do
    case $1 in
      --backbeat-revision)
        BACKBEAT_VERSION=${2}
        shift
        ;;
      --cloudserver-revision)
        CLOUDSERVER_VERSION=${2}
        shift
        ;;
      --dest)
        DEST=${2}
        shift
        ;;
      --upload)
        UPLOAD=${2}
        shift
        ;;
      -h|--help)
        usage 0
        ;;
      --nightly-suffix)
        NIGHTLY_SUFFIX=${2}
        shift
        ;;
      --)
        shift
        if [ $# -gt 0 ]; then
            echo "Warning: Ignoring arguments \"$*\"" >&2
        fi
        break
        ;;
      *)
        echo "Error: Argument invalid: $1" >&2
        usage 1
        ;;
    esac
    shift
  done

  test -n "${CLOUDSERVER_VERSION}" || usage 1
  test -n "${BACKBEAT_VERSION}" || usage 1
}

# Calculating global variables required
init() {
  # Variables related to helm chart packaging
  CHART_CURRENT_VERSION=$(grep "version:" ${CHART_PATH}/Chart.yaml | cut -c 10-)
  echo "Zenko Chart version: ${CHART_CURRENT_VERSION}"
  parse_semver ${CHART_CURRENT_VERSION}
  CHART_SEMVER=("${SEMVER[@]}")
  CHART_VERSION="${CHART_SEMVER[0]}.${CHART_SEMVER[1]}-${NIGHTLY_SUFFIX}"
  CHART_FULL_NAME="${DEST}/zenko-${CHART_VERSION}.tgz"

  # Variables related to components version
  CLOUDSERVER_SHORT_REV=$(get_short_rev ${CLOUDSERVER_REPO_URL} ${CLOUDSERVER_VERSION})
  echo "Cloudserver short commit ref: ${CLOUDSERVER_SHORT_REV}"

  BACKBEAT_SHORT_REV=$(get_short_rev ${BACKBEAT_REPO_URL} ${BACKBEAT_VERSION})
  echo "Backbeat short commit ref: ${BACKBEAT_SHORT_REV}"
}

package_chart() {
  helm dependency update ${CHART_PATH}
  helm package ${CHART_PATH} \
  --version "${CHART_VERSION}" \
  --app-version "${CHART_VERSION}" \
  --destination ${DEST} \
  --set cloudserver.image.repository="${REGISTRY}/${REPOSITORY}/cloudserver" \
  --set cloudserver.image.tag="${CLOUDSERVER_SHORT_REV}" \
  --set backbeat.image.repository="${REGISTRY}/${REPOSITORY}/backbeat" \
  --set backbeat.image.tag="${BACKBEAT_SHORT_REV}"
}

upload_chart() {

  # This operation can be done via the helm push plugin
  # but we're now doing it via curl until this issue
  # https://github.com/chartmuseum/helm-push/issues/37 is fixed

  echo "Uploading chart on registry"
  curl -L -u "${HARBOR_LOGIN}:${HARBOR_PASSWORD}" \
  -X POST "${REGISTRY}/api/chartrepo/${UPLOAD}/charts" \
  -H "accept: application/json" \
  -H  "Content-Type: multipart/form-data" \
  -F "chart=@${CHART_FULL_NAME};type=application/x-compressed-tar"

}

parse_opts "$@"
check_requirements
init
package_chart
if [[ ${UPLOAD} ]]; then
    upload_chart
fi
