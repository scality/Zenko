#!/bin/bash

set -u
set -e
set -o pipefail

# Use `nproc` to figure out how many CPUs are available, also in a container
# environment. The `auto` discovery of `pytest-xdist` uses the number of host
# cores.
NUM_CPUS=${NUM_CPUS:-$(nproc)}

if [ ${NUM_CPUS} -eq 1 ]; then
        PYTEST_XDIST_ARGS=""
else
        PYTEST_XDIST_ARGS="-n ${NUM_CPUS}"
fi

# Disable cache to run in a read-only container
exec pytest -p no:cacheprovider "${PYTEST_XDIST_ARGS}" "$@"
