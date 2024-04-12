#!/bin/bash
export GIT_ACCESS_TOKEN=${GITHUB_TOKEN}

echo $REGISTRY_PASSWORD | docker login registry.scality.com -u $REGISTRY_LOGIN --password-stdin

BASE_DIR=$(pwd)

cd .github/scripts/end2end/

bash ./bootstrap-kind.sh ${KIND_NODE_IMAGE} ${VOLUME_ROOT} ${WORKER_COUNT}
bash ./create-pull-image-secret.sh
bash ./install-kind-dependencies.sh
bash ./patch-coredns.sh
bash ./deploy-shell-ui.sh
bash ./keycloak-helper.sh setup-realm default

cd $BASE_DIR

bash .devcontainer/startup-zkop.sh

cd .github/scripts/end2end/

bash deploy-zenko.sh end2end default
bash keycloak-helper.sh add-user default
bash install-mocks.sh "default"

cd operator

sh tests/smoke/deploy-sorbet-resources.sh end2end

cd $BASE_DIR/tests/zenko_tests

envsubst < 'e2e-config.yaml.template' > 'e2e-config.yaml'
if [[ "${ENABLE_RING_TESTS}" == "false" ]]; then
yq -i 'del(.locations[] | select(.locationType == "location-scality-ring-s3-v1"))' e2e-config.yaml
fi
docker build -t $E2E_IMAGE_NAME:$E2E_IMAGE_TAG .

cd $BASE_DIR/.github/scripts/end2end

kind load docker-image  ${E2E_IMAGE_NAME}:${E2E_IMAGE_TAG}
docker rmi ${E2E_IMAGE_NAME}:${E2E_IMAGE_TAG}
bash configure-e2e.sh "end2end" ${E2E_IMAGE_NAME}:${E2E_IMAGE_TAG} "default"

bash configure-e2e-ctst.sh

docker image prune -af

cd $BASE_DIR

CTST_TAG=$(sed 's/.*"cli-testing": ".*#\(.*\)".*/\1/;t;d' ./tests/ctst/package.json)
SORBET_TAG=$(yq eval '.sorbet.tag' solution/deps.yaml)
docker build --build-arg CTST_TAG=$CTST_TAG --build-arg SORBET_TAG=$SORBET_TAG -t $E2E_CTST_IMAGE_NAME:$E2E_IMAGE_TAG ./tests/ctst
kind load docker-image  ${E2E_CTST_IMAGE_NAME}:${E2E_IMAGE_TAG}
docker rmi ${E2E_CTST_IMAGE_NAME}:${E2E_IMAGE_TAG}