#!/bin/bash

SCRIPT_FULL_PATH=$(readlink -f "$0")
REPOSITORY_DIR=$(dirname "$SCRIPT_FULL_PATH")/..
source "$REPOSITORY_DIR/VERSION" && \
    echo "${VERSION}"
