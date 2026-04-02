#!/bin/bash
set -exu

# Usage: run-e2e-ctst.sh <TAGS>
# Examples:
#   run-e2e-ctst.sh "@PreMerge"
#   run-e2e-ctst.sh "@PreMerge and not @PRA"
#   run-e2e-ctst.sh "@PRA"
#
# Expects setup-e2e-env.sh to have been sourced first
# (which sets CTST_WORLD_PARAMETERS and all required env vars).

TAGS=${1:?'Error: TAGS argument is required (e.g., "@PreMerge", "@PRA")'}
PARALLEL_RUNS=${PARALLEL_RUNS:-$(( ( $(nproc) + 1 ) / 2 ))}

DIR=$(dirname "$0")
CTST_DIR="$(cd "$DIR/../../../tests/ctst" && pwd)"

cd "$CTST_DIR"

yarn cucumber-js \
    --config cucumber.config.cjs \
    --tags "${TAGS}" \
    --world-parameters "${CTST_WORLD_PARAMETERS}" \
    --parallel "${PARALLEL_RUNS}" \
    --retry 3 \
    --retry-tag-filter @Flaky \
    --format pretty \
    --format html:reports/report.html
