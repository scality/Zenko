#!/bin/bash

# TODO: Add proper etc hosts
echo "127.0.0.1 local" | sudo tee -a /etc/hosts

export GIT_ACCESS_TOKEN=${GITHUB_TOKEN}

bash .github/scripts/end2end/bootstrap-kind.sh ${KIND_NODE_IMAGE} ${VOLUME_ROOT} ${WORKER_COUNT}
bash .github/scripts/end2end/create-pull-image-secret.sh
bash .github/scripts/end2end/install-kind-dependencies.sh
bash .github/scripts/end2end/patch-coredns.sh
bash .github/scripts/end2end/deploy-shell-ui.sh
bash .github/scripts/end2end/keycloak-helper.sh setup-realm default
bash .devcontainer/startup-zkop.sh