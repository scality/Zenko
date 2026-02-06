#!/bin/bash
set -exu

# This script is a modification of run.sh.
# It first builds a custom Docker image with the local test changes,
# and then runs the tests using that new image.

# --- Build Step ---
# Get username, default to 'local' if not found
USERNAME=${USER:-"local"}
CUSTOM_IMAGE="ghcr.io/scality/playground/$USERNAME/custom-ctst:latest"

echo "Building custom test image: $CUSTOM_IMAGE"
docker build \
    --build-arg SORBET_TAG=v1.2.2 \
    --build-arg DRCTL_TAG=v1.0.6 \
    --build-arg CTST_TAG=1.2.4 \
    . -t "$CUSTOM_IMAGE"
echo "Build complete."

echo "Loading image into kind cluster: $CUSTOM_IMAGE"
kind load docker-image "$CUSTOM_IMAGE"
echo "Load complete."
# --- End Build Step ---


# script used for local testing
COMMAND=${1:-"premerge"}
PARALLEL_RUNS=${2:-4}

# Enable SDK - setting this to false will run the CLI mode
# which is slower.
SDK=true

# Zenko Version
VERSION=$(cat ../../VERSION | grep -Po 'VERSION="\K[^"]*')

# Setting CTST world params
WORLD_PARAMETERS=${WORLD_PARAMETERS:-'{"subdomain":"zenko","ssl":false,"port":"80","AccountName":"zenko","AccountAccessKey":"accessKey1","AccountSecretKey":"secretKey1"}'}

# Running end2end ctst tests
kubectl run ctst-end2end \
        --pod-running-timeout=5m \
        --image="$CUSTOM_IMAGE" \
        --restart=Never \
        --rm \
        --attach=True \
        --image-pull-policy=Never \
        --env=TARGET_VERSION=$VERSION  \
        -- ./run "$COMMAND" "$WORLD_PARAMETERS" --parallel "$PARALLEL_RUNS"
