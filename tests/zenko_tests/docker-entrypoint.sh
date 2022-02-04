#!/bin/sh

EXIT_STATUS="0"

enter_and_run() {
    local old_cwd="$(pwd)"
    cd "$1"
    sh -c "$2"
    if [ "$?" -ne "0" ]; then
        EXIT_STATUS="1"
        echo "$2 have failed"
    fi
    cd "$old_cwd"
}

get_token() {
    curl -k -H "Host: keycloak.zenko.local" \
        -d "client_id=${CYPRESS_KEYCLOAK_CLIENT_ID}" \
        -d "username=${CYPRESS_KEYCLOAK_USERNAME}" \
        -d "password=${CYPRESS_KEYCLOAK_PASSWORD}" \
        -d "grant_type=password" \
        -d 'scope=openid' \
        https://localhost/auth/realms/${CYPRESS_KEYCLOAK_REALM}/protocol/openid-connect/token | \
        jq -cr '.id_token'
}

# Run the tests
echo "Running test stage: $STAGE"

if [ "$STAGE" = "end2end" ]; then
    enter_and_run node_tests "npm_chain.sh test_operator test_ui"
elif [ "$STAGE" = "smoke" ]; then
    enter_and_run node_tests "npm_chain.sh test_smoke"
elif [ "$STAGE" = "backbeat" ]; then
    # TODO: use node js to create and remove buckets
    python3 create_buckets.py
    if [ "$?" -ne "0" ]; then
        exit 1
    fi
    # locations need to be created after the location's bucket creation.
    UPDATED_TOKEN=$(get_token)
    python3 create_locations.py "$UPDATED_TOKEN"
    if [ "$?" -ne "0" ]; then
        exit 1
    fi

    # wait locations propagate
    sleep 60

    enter_and_run node_tests "npm_chain.sh test_aws_crr test_ingestion_oob_s3c"

    UPDATED_TOKEN=$(get_token) 
    python3 delete_locations.py $UPDATED_TOKEN
    if [ "$?" -ne "0" ]; then
        exit 1
    fi

    python3 cleans3c.py
    if [ "$?" -ne "0" ]; then
        exit 1
    fi
fi

exit "$EXIT_STATUS"
