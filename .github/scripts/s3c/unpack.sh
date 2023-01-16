#!/bin/bash

# This script is responsible for making a directory with the Federation source avaiable for the installer
#
# It uses, in order of precedence:
# - A gzipped tar archive at the path defined in $FEDERATION_ARCHIVE
#   The archive will be extracted so that federation is at the path defined in $FEDERATION_DIRECTORY
#
# - A git reference defined in $FEDERATION_REF
#   The Federation repo will be cloned to the path defined in $FEDERATION_DIRECTORY,
#   and the given reference checkout out
#
# - A pre-existing directory defined in $FEDERATION_DIRECTORY
#   Will only check that the directory exists

set -ex -o pipefail

SCRIPT_USER="$(whoami)"

echo "Federation directory $FEDERATION_DIRECTORY"
S3_DIRECTORY="$(dirname "$FEDERATION_DIRECTORY")"
INSTALLER_DIRECTORY="$(dirname "$S3_DIRECTORY")"

sudo mkdir -p "$INSTALLER_DIRECTORY"
sudo chown "$SCRIPT_USER:$SCRIPT_USER" "$INSTALLER_DIRECTORY"

if [ -n "$FEDERATION_URL" ]; then
    echo "Downloading Federation archive from $FEDERATION_URL"
    wget -O /tmp/s3-offline.tar.gz "$FEDERATION_URL"
    FEDERATION_ARCHIVE=/tmp/s3-offline.tar.gz
fi

if [ -n "$FEDERATION_ARCHIVE" ]; then
    echo "Using federation from archive $FEDERATION_ARCHIVE"
    mkdir -p "$S3_DIRECTORY"
    tar -xvz -C "$S3_DIRECTORY" --strip-components=1 -f "$FEDERATION_ARCHIVE"

elif [ -n "$FEDERATION_REF" ]; then
    echo "Using federation from git reference $FEDERATION_REF"
    git clone "$FEDERATION_REPO" "$FEDERATION_DIRECTORY"
    pushd "$FEDERATION_DIRECTORY"
    git checkout "$FEDERATION_REF"
    popd
fi

if [ ! -d "$FEDERATION_DIRECTORY" ]; then
    echo "No federation sources found at $FEDERATION_DIRECTORY"
    exit 1
fi
