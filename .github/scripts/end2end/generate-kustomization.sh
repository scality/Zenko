#!/bin/bash

set -euo pipefail

# Constants for valid topologies for CI tests
readonly VALID_TOPOLOGIES=(
    "1:1"  # 1 node, 1 shard
    "1:2"  # 1 node, 2 shards
    "3:1"  # 3 nodes, 1 shard
    "3:3"  # 3 nodes, 3 shards
    "6:1"  # 6 nodes, 1 shard
    "6:3"  # 6 nodes, 3 shards
    "6:2"  # 6 nodes, 2 shards
    "6:6"  # 6 nodes, 6 shards
    "9:1"  # 9 nodes, 1 shard
    "9:3"  # 9 nodes, 3 shards
    "9:6"  # 9 nodes, 6 shards
    "9:9"  # 9 nodes, 9 shards
)

generate_kustomization() {
    local node_count=$1
    local shard_count=$2
    local kustomization_file="kustomization.yaml"
    local base_yaml="mongodb-sharded-${node_count}-node"
    
    [[ "$shard_count" -gt 1 ]] && base_yaml="${base_yaml}-${shard_count}-shards"
    base_yaml="${base_yaml}.yaml"

    # Validate topology
    local topology_key="${node_count}:${shard_count}"
    [[ ! " ${VALID_TOPOLOGIES[*]} " =~ ${topology_key} ]] && {
        echo "Error: Invalid topology - ${node_count} nodes, ${shard_count} shards"
        exit 1
    }

    cat > "$kustomization_file" << EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ./_build/root/deploy/${base_yaml}
patches:
EOF

    # Add configsvr patch
    cat >> "$kustomization_file" << EOF
- patch: |
    - op: add
      path: /spec/volumeClaimTemplates/-
      value:
        metadata:
          name: datadir
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: "8Gi"
          storageClassName: standard
  target:
    kind: StatefulSet
    name: data-db-mongodb-sharded-configsvr
EOF

    # Add shard patches
    for ((i=0; i<shard_count; i++)); do
        cat >> "$kustomization_file" << EOF
- patch: |
    - op: add
      path: /spec/volumeClaimTemplates/-
      value:
        metadata:
          name: datadir
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: "8Gi"
          storageClassName: standard
  target:
    kind: StatefulSet
    name: data-db-mongodb-sharded-shard${i}-data
EOF
    done

    echo "Generated kustomization file: $kustomization_file"
    cat "$kustomization_file"
}
