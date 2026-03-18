#!/usr/bin/env bash

set -ex

[ -z "${OPERATOR_IMAGE_TAG}" ] && OPERATOR_IMAGE_TAG="$(yq eval '."zenko-operator".tag' solution/deps.yaml)"

OPERATOR_PATH=./.github/scripts/end2end/operator
LOCAL_OPERATOR_PATH=../zenko-operator
if [ -d "$LOCAL_OPERATOR_PATH" ]; then
    echo "Using local zenko-operator checkout at $LOCAL_OPERATOR_PATH"
    ln -sfn "$(readlink -f "$LOCAL_OPERATOR_PATH")" "$OPERATOR_PATH"
else
    git init $OPERATOR_PATH
    git -C $OPERATOR_PATH fetch --depth 1 --no-tags https://git:${GIT_ACCESS_TOKEN}@github.com/scality/zenko-operator.git ${OPERATOR_IMAGE_TAG}
    git -C $OPERATOR_PATH checkout FETCH_HEAD
fi

cd $OPERATOR_PATH
tilt ci