#!/usr/bin/env bash

set -ex

env_variables=$(yq eval '.env | to_entries | .[] | .key + "=" + .value' .github/workflows/end2end.yaml | sed 's/\${{[^}]*}}//g') && export $env_variables
export GIT_ACCESS_TOKEN=${GITHUB_TOKEN}
export E2E_IMAGE_TAG=latest

export VOLUME_ROOT=$PWD/artifacts
export ZENKO_MONGODB_DATABASE=${ZENKO_MONGODB_DATABASE:-zenko-database}
export HOST_DNS=$(awk '/^nameserver/{print $2; exit}' /etc/resolv.conf)
mkdir -p "${VOLUME_ROOT}/data"

# Disable GCP tests as we don't have credentials setup in devcontainer
export GCP_BACKEND_DESTINATION_LOCATION=

GITHUB_ENV=$(mktemp /tmp/github_env.XXXXXX)

for input in $(yq '.inputs | to_entries | .[] | .key + "=" + .value.default' .github/actions/deploy/action.yaml); do
    inputName=GITHUB_INPUTS_${input%=*}
    [ -z "${!inputName}" ] && export GITHUB_INPUTS_$input
done

array_length=$(yq ".runs.steps | length - 1" .github/actions/deploy/action.yaml)
for i in $(seq 0 $array_length); do
    #step=$(yq ".runs.steps[$i]" .github/actions/deploy/action.yaml)
    working_dir=$(yq ".runs.steps[$i].working-directory" .github/actions/deploy/action.yaml)
    run_command=$(yq ".runs.steps[$i].run" .github/actions/deploy/action.yaml)

    # We don't want to run `run-e2e-test.sh` because it is used for linting here, user will run it manually if needed after deployment
    # We can't run `configure-e2e.sh` here because it needs an image that is not yet built and sent to kind, will be run after
    (
        if [[ "$run_command" != "null" && "$run_command" != *"configure-e2e.sh"* && "$run_command" != *"run-e2e-test.sh"* ]]; then
            # Inject env 'generated' from previous steps
            source "$GITHUB_ENV"

            # Inject variables
            # We use `sed` to replace github variable references and avoid bad substitution error from bash
            env_variables=$(yq '.runs.steps['$i'].env | to_entries | .[] | .key + "=" + .value' .github/actions/deploy/action.yaml \
                | sed -e 's/${{ *inputs.\([[:graph:]]*\) *}}/$GITHUB_INPUTS_\1/' -e 's/\${{.*}}//' \
                | envsubst )
            [ -n "$env_variables" ] && export $env_variables

            if [ "$working_dir" != "null" ]; then
                echo "Changing working dir: $working_dir"
                cd $working_dir
            fi

            echo "Run command: $run_command"
            eval "$run_command";
        fi
    )
    exit
done

(
    cd tests/zenko_tests

    envsubst < 'e2e-config.yaml.template' > 'e2e-config.yaml'
    if [[ "${ENABLE_RING_TESTS}" == "false" ]]; then
        yq -i 'del(.locations[] | select(.locationType == "location-scality-ring-s3-v1"))' e2e-config.yaml
    fi

    if [ -z "$GCP_BACKEND_DESTINATION_LOCATION" ]; then
        yq -i 'del(.locations[] | select(.locationType == "location-gcp-v1"))' e2e-config.yaml
    fi

    docker build -t $E2E_IMAGE_NAME:$E2E_IMAGE_TAG .
    kind load docker-image  ${E2E_IMAGE_NAME}:${E2E_IMAGE_TAG}
    docker rmi ${E2E_IMAGE_NAME}:${E2E_IMAGE_TAG}
)

(
    cd .github/scripts/end2end

    bash configure-e2e.sh

    bash configure-e2e-ctst.sh
)

# Build CTST image from current branch
SORBET_TAG=$(yq eval '.sorbet.tag' solution/deps.yaml)
DRCTL_TAG=$(yq eval '.drctl.tag' solution/deps.yaml)
TAG_NAME=ctst_codespace_setup
GIT_AUTH_TOKEN=$GITHUB_TOKEN docker build --secret id=GIT_AUTH_TOKEN --build-arg SORBET_TAG=$SORBET_TAG --build-arg DRCTL_TAG=$DRCTL_TAG -t $E2E_CTST_IMAGE_NAME:$TAG_NAME ./tests/ctst
kind load docker-image ${E2E_CTST_IMAGE_NAME}:$TAG_NAME
docker rmi ${E2E_CTST_IMAGE_NAME}:$TAG_NAME
