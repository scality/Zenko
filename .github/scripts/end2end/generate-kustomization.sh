#!/bin/bash

set -euo pipefail

# Constants for valid topologies for CI tests
readonly VALID_TOPOLOGIES=(
    "1:1" "1:2" "3:1" "3:3" "6:1" "6:3" "6:2" "6:6" "9:1" "9:3" "9:6" "9:9"
)

generate_kustomization() {
    local node_count=$1
    local shard_count=$2
    local kustomization_file="${DIR}/kustomization.yaml"
    local base_yaml="mongodb-sharded-${node_count}-node"

    touch "$kustomization_file"

    # Adjust file name if there are multiple shards
    [[ "$shard_count" -gt 1 ]] && base_yaml="${base_yaml}-${shard_count}-shards"
    base_yaml="${base_yaml}.yaml"

    # Validate topology
    local topology_key="${node_count}:${shard_count}"
    [[ ! " ${VALID_TOPOLOGIES[*]} " =~ ${topology_key} ]] && {
        echo "Error: Invalid topology - ${node_count} nodes, ${shard_count} shards"
        exit 1
    }

    # Generate base kustomization file with the right base resource
    cat > "$kustomization_file" << EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ${DIR}/_build/root/deploy/${base_yaml}
EOF
}
