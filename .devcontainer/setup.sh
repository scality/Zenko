#!/usr/bin/env bash

set -e

env_variables=$(yq eval '.env | to_entries | .[] | .key + "=" + .value' .github/workflows/end2end.yaml | sed 's/\${{[^}]*}}//g') && export $env_variables

# In CI, GIT_ACCESS_TOKEN comes from a GitHub App token.
# Locally, we need the user to provide one (usually via GITHUB_TOKEN).
if [[ -z "${GIT_ACCESS_TOKEN:-}" ]]; then
    export GIT_ACCESS_TOKEN="${GITHUB_TOKEN:-}"
fi

if [[ -z "${GIT_ACCESS_TOKEN:-}" ]]; then
    echo "ERROR: Missing GitHub token. Set GITHUB_TOKEN (or GIT_ACCESS_TOKEN) with access to scality/zenko-operator." >&2
    echo "Example: export GITHUB_TOKEN=ghp_***" >&2
    exit 1
fi

export E2E_IMAGE_TAG=latest

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
    step_if=$(yq ".runs.steps[$i].if" .github/actions/deploy/action.yaml)

    # We don't want to run `run-e2e-test.sh` because it is used for linting here, user will run it manually if needed after deployment
    # We can't run `configure-e2e.sh` here because it needs an image that is not yet built and sent to kind, will be run after
    (
        should_run=true

        # Best-effort support for composite action `if:` (CI evaluates these, local runner must emulate).
        if [[ "$step_if" != "null" ]]; then
            # Only conditional step in the deploy action today.
            if [[ "$step_if" == *"inputs.deploy_metadata"* ]]; then
                if [[ "${GITHUB_INPUTS_deploy_metadata:-false}" != "true" ]]; then
                    should_run=false
                fi
            else
                echo "Skipping step with unsupported condition: $step_if"
                should_run=false
            fi
        fi

        if [[ "$should_run" == "true" && "$run_command" != "null" && "$run_command" != *"configure-e2e.sh"* && "$run_command" != *"run-e2e-test.sh"* ]]; then
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

docker image prune -af

CTST_TAG=$(sed 's/.*"cli-testing": ".*#\(.*\)".*/\1/;t;d' ./tests/ctst/package.json)
SORBET_TAG=$(yq eval '.sorbet.tag' solution/deps.yaml)
DRCTL_TAG=$(yq eval '.drctl.tag' solution/deps.yaml)
docker build --build-arg CTST_TAG=$CTST_TAG --build-arg SORBET_TAG=$SORBET_TAG --build-arg DRCTL_TAG=$DRCTL_TAG -t $E2E_CTST_IMAGE_NAME:$E2E_IMAGE_TAG ./tests/ctst
kind load docker-image  ${E2E_CTST_IMAGE_NAME}:${E2E_IMAGE_TAG}
