#!/bin/sh

set -x

ARTIFACTS_USER=${ARTIFACTS_USER}
ARTIFACTS_PASSWORD=${ARTIFACTS_PASSWORD}
ARTIFACTS_NAME=${ARTIFACTS_NAME}
ARTIFACTS_URL=${ARTIFACTS_URL}
ARCHIVE="artifacts.tar.gz"
TEMP_DIR=$(mktemp -d)
JUNIT_DIR="$TEMP_DIR/junit"


upload() {
    curl -u $ARTIFACTS_USER:$ARTIFACTS_PASSWORD \
        --progress-bar \
        --verbose \
        -T \
        $ARCHIVE \
        -X PUT \
        $ARTIFACTS_URL/upload/$ARTIFACTS_NAME
}

create_archive() {
    mkdir -p $JUNIT_DIR
    find . -name "*junit*.xml" -exec cp {} $JUNIT_DIR ";"
    tar -C $TEMP_DIR . -chvzf $ARCHIVE 

}

create_archive
upload
