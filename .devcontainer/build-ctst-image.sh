#!/bin/sh

CTST_TAG=$(sed 's/.*"cli-testing": ".*#\(.*\)".*/\1/;t;d' ./tests/ctst/package.json)
SORBET_TAG=$(yq eval '.sorbet.tag' solution/deps.yaml)
docker build --build-arg CTST_TAG=$CTST_TAG --build-arg SORBET_TAG=$SORBET_TAG -t $E2E_CTST_IMAGE_NAME:$E2E_IMAGE_TAG ./test/ctst
kind load docker-image  ${E2E_CTST_IMAGE_NAME}:${E2E_IMAGE_TAG}
docker rmi ${E2E_CTST_IMAGE_NAME}:${E2E_IMAGE_TAG}