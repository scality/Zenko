#!/bin/bash

env_variables=$(yq eval '.env | to_entries | .[] | .key + "=" + .value' .github/workflows/end2end.yaml | sed 's/\${{[^}]*}}//g') && export $env_variables
export GIT_ACCESS_TOKEN=${GITHUB_TOKEN}
export E2E_IMAGE_TAG=latest

array_length=`yq ".runs.steps | length - 1" .github/actions/deploy/action.yaml`
for i in $(seq 0 $array_length); do
    step=`yq ".runs.steps[$i]" .github/actions/deploy/action.yaml`
    working_dir=`yq ".runs.steps[$i].working-directory" .github/actions/deploy/action.yaml`
    run_command=`yq ".runs.steps[$i].run" .github/actions/deploy/action.yaml`

    # We don't want to run `run-e2e-test.sh` because it is used for linting here, user will run it manually if needed after deployment
    # We can't run `configure-e2e.sh` here because it needs an image that is not yet built and sent to kind, will be run after
    (
        if [[ "$run_command" != "null" && "$run_command" != *"configure-e2e.sh"* && "$run_command" != *"run-e2e-test.sh"* ]]
        then
            if [ "$working_dir" != "null" ]
            then
                echo "Changing working dir: $working_dir"
                cd $working_dir
            fi
            echo "Run command: $run_command"
            while IFS= read -r line; do
                eval $line
            done <<< "$run_command";
        fi
    )
done

(
    cd tests/zenko_tests

    envsubst < 'e2e-config.yaml.template' > 'e2e-config.yaml'
    if [[ "${ENABLE_RING_TESTS}" == "false" ]]; then
    yq -i 'del(.locations[] | select(.locationType == "location-scality-ring-s3-v1"))' e2e-config.yaml
    fi
    docker build -t $E2E_IMAGE_NAME:$E2E_IMAGE_TAG .
    kind load docker-image  ${E2E_IMAGE_NAME}:${E2E_IMAGE_TAG}
    docker rmi ${E2E_IMAGE_NAME}:${E2E_IMAGE_TAG}
)

(
    cd .github/scripts/end2end

    bash configure-e2e-ctst.sh
)

docker image prune -af

CTST_TAG=$(sed 's/.*"cli-testing": ".*#\(.*\)".*/\1/;t;d' ./tests/ctst/package.json)
SORBET_TAG=$(yq eval '.sorbet.tag' solution/deps.yaml)
docker build --build-arg CTST_TAG=$CTST_TAG --build-arg SORBET_TAG=$SORBET_TAG -t $E2E_CTST_IMAGE_NAME:$E2E_IMAGE_TAG ./tests/ctst
kind load docker-image  ${E2E_CTST_IMAGE_NAME}:${E2E_IMAGE_TAG}
