#!/usr/bin/env bash

set -ex

# Persist workflow env vars so they survive across terminal sessions
ZENKO_ENV_FILE="$HOME/.zenko.env"
yq eval '.env | to_entries | .[] | "export " + .key + "=" + (.value | tostring | @sh)' .github/workflows/end2end.yaml \
    | sed -e "s|\${{ *github.workspace *}}|$(pwd)|g" -e 's/\${{[^}]*}}//g' > "$ZENKO_ENV_FILE"
echo 'export GIT_ACCESS_TOKEN="${GITHUB_TOKEN}"' >> "$ZENKO_ENV_FILE"

echo 'export VOLUME_ROOT=$PWD/artifacts' >> "$ZENKO_ENV_FILE"
echo 'export ZENKO_MONGODB_DATABASE=${ZENKO_MONGODB_DATABASE:-zenko-database}' >> "$ZENKO_ENV_FILE"
echo "export HOST_DNS=$(awk '/^nameserver/{print \$2; exit}' /etc/resolv.conf)" >> "$ZENKO_ENV_FILE"
mkdir -p "$PWD/artifacts/data"
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

    (
        [[ "$run_command" == "null" ]] && exit 0
        # We can't run `configure-e2e.sh` here because it needs services to be ready first, will be run after
        [[ "$run_command" == *"configure-e2e.sh"* ]] && exit 0
        # We don't want to run `run-e2e-test.sh` because it is used for linting here, user will run it manually if needed after deployment
        [[ "$run_command" == *"run-e2e-test.sh"* ]] && exit 0
        [[ "$run_command" == *"deploy-metadata.sh"* && "${ENABLE_RING_TESTS}" == "false" ]] && exit 0

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
    )
done

(
    cd .github/scripts/end2end

    bash configure-e2e.sh

    bash configure-e2e-ctst.sh
)


# Extract sorbet & drctl binaries for out-of-cluster test execution
CTST_DIR="./tests/ctst"
SORBET_IMAGE=$(yq eval '.sorbet | .sourceRegistry + "/" + .image' solution/deps.yaml)
SORBET_TAG=$(yq eval '.sorbet.tag' solution/deps.yaml)
DRCTL_IMAGE=$(yq eval '.drctl | .sourceRegistry + "/" + .image' solution/deps.yaml)
DRCTL_TAG=$(yq eval '.drctl.tag' solution/deps.yaml)

_cid=$(docker create "${SORBET_IMAGE}:${SORBET_TAG}" true)
docker cp "${_cid}:/sorbetctl" "${CTST_DIR}/sorbetctl"
docker rm "${_cid}" >/dev/null
chmod +x "${CTST_DIR}/sorbetctl"

_cid=$(docker create "${DRCTL_IMAGE}:${DRCTL_TAG}" true)
docker cp "${_cid}:/zenko-drctl" "${CTST_DIR}/zenko-drctl"
docker rm "${_cid}" >/dev/null
chmod +x "${CTST_DIR}/zenko-drctl"

# Install CTST test dependencies
(cd "${CTST_DIR}" && yarn install --frozen-lockfile)
