#!/bin/bash
set -eu

# Detect unused Cucumber step definitions by running a dry-run
# and checking for UNUSED entries in the usage report.
# Exit code: 0 if none found, 1 if unused steps exist.

unused=$(cucumber-js --config cucumber.config.cjs --dry-run --format usage --parallel 1 2>&1 | grep UNUSED || true)

if [ -n "$unused" ]; then
    echo "Unused step definitions found:"
    echo "$unused"
    exit 1
else
    echo "No unused step definitions."
fi
