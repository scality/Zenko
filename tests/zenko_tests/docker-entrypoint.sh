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

echo 'Waiting for ceph'
sh wait_for_ceph.sh zenko-ceph-ceph-in-a-box

# Setup our environment
python3 create_buckets.py
if [ "$?" -ne "0" ]; then
    exit 1
fi

# Run the tests
echo "Running test stage: $STAGE"
if [ "$STAGE" = 'python-tests' ]; then
    enter_and_run python_tests "./run.sh $PYTHON_ARGS"
elif [ "$STAGE" = 'node-tests-01' ]; then
    enter_and_run node_tests "npm_chain.sh test_aws_crr test_api test_location_quota test_bucket_get_v2 test_ingestion_oob_s3c"
    python3 cleans3c.py
elif [ "$STAGE" = 'node-tests-02' ]; then
    enter_and_run node_tests "npm_chain.sh test_gcp_crr test_azure_crr test_one_to_many test_lifecycle test_crr_pause_resume"
else
    enter_and_run python_tests "./run.sh $PYTHON_ARGS"
    # test_crr runs "test_aws_crr test_gcp_crr test_azure_crr test_one_to_many"
    enter_and_run node_tests "npm_chain.sh test_crr test_api test_crr_pause_resume test_location_quota test_bucket_get_v2"
    python3 cleans3c.py
fi

exit "$EXIT_STATUS"
