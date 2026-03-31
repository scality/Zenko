#!/usr/bin/env bash

set -e

# Persist workflow env vars so they survive across terminal sessions
ZENKO_ENV_FILE="$HOME/.zenko.env"
yq eval '.env | to_entries | .[] | "export " + .key + "=" + (.value | tostring | @sh)' .github/workflows/end2end.yaml \
    | sed 's/\${{[^}]*}}//g' > "$ZENKO_ENV_FILE"
echo 'export GIT_ACCESS_TOKEN="${GITHUB_TOKEN}"' >> "$ZENKO_ENV_FILE"
# Disable GCP tests as we don't have credentials setup in devcontainer
echo 'export GCP_BACKEND_DESTINATION_LOCATION=' >> "$ZENKO_ENV_FILE"

# Source now for this session
source "$ZENKO_ENV_FILE"

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

    # We can't run `configure-e2e.sh` here because it needs services to be ready first, will be run after
    # User will run tests manually after deployment
    (
        if [[ "$run_command" != "null" && "$run_command" != *"configure-e2e.sh"* ]]; then
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
    cd .github/scripts/end2end

    bash configure-e2e.sh

    bash configure-e2e-ctst.sh
)

docker image prune -af

# Build CTST image from current branch 
SORBET_TAG=$(yq eval '.sorbet.tag' solution/deps.yaml)
DRCTL_TAG=$(yq eval '.drctl.tag' solution/deps.yaml)
TAG_NAME=ctst_codespace_setup
GIT_AUTH_TOKEN=$GITHUB_TOKEN docker build --secret id=GIT_AUTH_TOKEN --build-arg SORBET_TAG=$SORBET_TAG --build-arg DRCTL_TAG=$DRCTL_TAG -t $E2E_CTST_IMAGE_NAME:$TAG_NAME ./tests/ctst
kind load docker-image ${E2E_CTST_IMAGE_NAME}:$TAG_NAME
