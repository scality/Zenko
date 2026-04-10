#!/bin/bash
set -exu

# Usage: run-e2e-ctst.sh <TAGS>
# Examples:
#   run-e2e-ctst.sh "@PreMerge"
#   run-e2e-ctst.sh "@PreMerge and not @PRA"
#   run-e2e-ctst.sh "@PRA"
#
# Prerequisites:
#   configure-e2e-ctst.sh must be run once before first use (deployed by
#   devcontainer setup.sh or as a separate CI workflow step).

TAGS=${1:?'Error: TAGS argument is required (e.g., "@PreMerge", "@PRA")'}
PARALLEL_RUNS=${PARALLEL_RUNS:-$(( ( $(nproc) + 1 ) / 2 ))}

DIR=$(cd "$(dirname "$0")" && pwd)

source "$DIR/setup-e2e-env.sh"

CTST_DIR="$(cd "$DIR/../../../tests/ctst" && pwd)"
cd "$CTST_DIR"
mkdir -p reports

export SDK=true # Cli-testing also has a cli mode, not really used in practice
yarn cucumber-js \
    --config cucumber.config.cjs \
    --tags "${TAGS}" \
    --world-parameters "${CTST_WORLD_PARAMETERS}" \
    --parallel "${PARALLEL_RUNS}" \
    --retry 3 \
    --retry-tag-filter @Flaky \
    --format pretty \
    --format html:reports/report.html \
    --format junit:reports/report.xml
