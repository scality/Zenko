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

# Setup our environment
# TODO: use node js to create and remove buckets
python3 create_buckets.py
if [ "$?" -ne "0" ]; then
    exit 1
fi

# locations need to be created after the location's bucket creation.
python3 create_locations.py
if [ "$?" -ne "0" ]; then
    exit 1
fi

# wait locations propagate
sleep 60

# Run the tests
echo "Running test stage: $STAGE"

if [ "$STAGE" = "end2end" ]; then
    enter_and_run node_tests "npm_chain.sh test_operator test_ui"
elif [ "$STAGE" = "smoke" ]; then
    enter_and_run node_tests "npm_chain.sh test_smoke"
elif [ "$STAGE" = "backbeat" ]; then
    enter_and_run node_tests "npm_chain.sh test_aws_crr test_ingestion_oob_s3c"
fi

python3 delete_locations.py
if [ "$?" -ne "0" ]; then
    exit 1
fi

python3 cleans3c.py
if [ "$?" -ne "0" ]; then
    exit 1
fi

exit "$EXIT_STATUS"
