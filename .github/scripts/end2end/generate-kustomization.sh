#!/bin/bash

set -euo pipefail

# Constants for valid topologies for CI tests
# We support multiple shards per host, or one shard per host, up to 9 nodes
# The first number is the number of nodes, the second is the number of shards
readonly VALID_TOPOLOGIES=(
    "1:1" "1:2" "3:1" "3:3" "6:1" "6:2" "6:6" "9:1" "9:3" "9:9" "12:1" "12:4" "12:12"
)

generate_base_kustomization_and_validate_topology() {
    local node_count=$1
    local shard_count=$2
    # DIR is expected to be set by the sourcing script (e.g., install-kind-dependencies.sh)
    # It defines where kustomization.yaml will be created and the base for relative paths.
    if [ -z "${DIR+x}" ]; then # Check if DIR is set
        echo "Error: DIR variable is not set. This script expects DIR to be defined by the calling environment."
        exit 1
    fi
    local kustomization_file="${DIR}/kustomization.yaml"
    local base_yaml_name="mongodb-sharded-${node_count}-node"

    # Validate topology
    local topology_key="${node_count}:${shard_count}"
    if [[ ! " ${VALID_TOPOLOGIES[*]} " =~ " ${topology_key} " ]]; then
        echo "Error: Invalid topology - ${node_count} nodes, ${shard_count} shards"
        exit 1
    fi

    # Adjust base YAML name if there are multiple shards
    [[ "$shard_count" -gt 1 ]] && base_yaml_name="${base_yaml_name}-${shard_count}-shards"
    base_yaml_name="${base_yaml_name}.yaml"

    # Generate base kustomization file with JSON patches to remove selectors
    cat > "$kustomization_file" << EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ${DIR}/_build/root/deploy/${base_yaml_name}
patches:
EOF

    # Add configsvr patch to remove selector from volumeClaimTemplates
    cat >> "$kustomization_file" << EOF
- target:
    group: apps
    version: v1
    kind: StatefulSet
    name: data-db-mongodb-sharded-configsvr
  patch: |-
    - op: remove
      path: /spec/volumeClaimTemplates/0/spec/selector
EOF

    # Add shard patches to remove selector from volumeClaimTemplates
    for ((i=0; i<shard_count; i++)); do
        cat >> "$kustomization_file" << EOF
- target:
    group: apps
    version: v1
    kind: StatefulSet
    name: data-db-mongodb-sharded-shard${i}-data
  patch: |-
    - op: remove
      path: /spec/volumeClaimTemplates/0/spec/selector
EOF
    done
}
