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
enter_and_run node_tests "npm_chain.sh test_ingestion_s3c"

exit "$EXIT_STATUS"
