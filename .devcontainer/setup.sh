#!/bin/bash

CURRENT_DIR=$(pwd)

cd .github/scripts/end2end/

bash ./bootstrap-kind.sh ${KIND_NODE_IMAGE} ${VOLUME_ROOT} ${WORKER_COUNT}
bash ./create-pull-image-secret.sh
bash ./install-kind-dependencies.sh
bash ./patch-coredns.sh
bash ./deploy-shell-ui.sh
bash ./keycloak-helper.sh setup-realm default

cd $CURRENT_DIR

bash .devcontainer/startup-zkop.sh