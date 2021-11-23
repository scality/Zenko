#! /usr/bin/env bash

declare -A errors=()

for dash in monitoring/dashboards/*.json; do
    echo "Verifying $dash"
    expected_rev=$(git rev-list HEAD -- $dash | wc -l)
    effective_rev=$(jq '.version' < $dash)
    if [ $expected_rev -ne $effective_rev ]; then
        errors[$dash]=$expected_rev
    fi
done
if [ ${#errors[@]} -ne 0 ]; then
    echo "Unincremented versions in Grafana dashboards:"
    for dash in ${!errors[@]}; do
        echo "${dash}: expected version ${errors[$dash]}"
    done
    exit 1
fi
echo "All dashboards in expected versions."
