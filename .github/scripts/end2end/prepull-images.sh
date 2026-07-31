#!/bin/bash

# Warm the containerd cache of the kind worker nodes with the solution
# images, so that the operator's rollout of the Zenko CR never waits on
# a cold image pull: a single pull landing in the middle of the rollout
# is enough to exceed the deploy timeout.
#
# Best effort by design: every failure is ignored, the kubelet then
# pulls the image itself as it did before.

set -u

DEPS_PATH=${1:-"$(git rev-parse --show-toplevel)/solution/deps.yaml"}
CLUSTER_NAME=${CLUSTER_NAME:-kind}
PREPULL_PARALLELISM=${PREPULL_PARALLELISM:-6}
PREPULL_MARKER=${PREPULL_MARKER:-${RUNNER_TEMP:-/tmp}/prepull-images.done}
DOCKER_CONFIG_FILE=${DOCKER_CONFIG_FILE:-${HOME}/.docker/config.json}

rm -f "${PREPULL_MARKER}"
# the waiter must never be left hanging, whatever happens below
trap 'touch "${PREPULL_MARKER}"' EXIT

get_images() {
    yq eval 'to_entries | .[] | select(.value.image != null) |
        ((.value.sourceRegistry // "docker.io") + "/" + .value.image + ":" + (.value.tag // "latest"))' \
        "${DEPS_PATH}" | sort -u
}

get_nodes() {
    local nodes
    nodes=$(kind get nodes --name "${CLUSTER_NAME}" 2>/dev/null)
    # pods land on the workers; on a single node cluster, that node runs
    # everything
    if echo "${nodes}" | grep -qv control-plane; then
        echo "${nodes}" | grep -v control-plane
    else
        echo "${nodes}"
    fi
}

pull_one() {
    local node=$1 image=$2
    local auth=()

    # containerd does not read the kubelet credentials, pass them along
    # for the registries that need them
    case "${image}" in
        ghcr.io/*) [ -n "${GHCR_AUTH:-}" ] && auth=(--auth "${GHCR_AUTH}") ;;
    esac

    if docker exec "${node}" crictl pull "${auth[@]}" "${image}" >/dev/null 2>&1; then
        echo "pulled  ${image} on ${node}"
    else
        echo "skipped ${image} on ${node} (pull failed, kubelet will retry)"
    fi
}
export -f pull_one

if [ -r "${DOCKER_CONFIG_FILE}" ]; then
    GHCR_AUTH=$(jq -r '.auths["ghcr.io"].auth // empty' "${DOCKER_CONFIG_FILE}" 2>/dev/null)
    export GHCR_AUTH
fi

images=$(get_images)
nodes=$(get_nodes)

if [ -z "${images}" ] || [ -z "${nodes}" ]; then
    echo "nothing to pre-pull (images: $(echo "${images}" | grep -c . ), nodes: $(echo "${nodes}" | grep -c . ))"
    exit 0
fi

echo "pre-pulling $(echo "${images}" | wc -l) images on $(echo "${nodes}" | wc -l) node(s)"
start=${SECONDS}

for node in ${nodes}; do
    for image in ${images}; do
        printf '%s %s\n' "${node}" "${image}"
    done
done | xargs -P "${PREPULL_PARALLELISM}" -L1 bash -c 'pull_one "$1" "$2"' _

echo "pre-pull done in $((SECONDS - start))s"
