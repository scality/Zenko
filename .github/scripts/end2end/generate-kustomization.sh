#!/bin/bash

set -euo pipefail

# Constants for valid topologies for CI tests
readonly VALID_TOPOLOGIES=(
    "1:1" "1:2" "3:1" "3:3" "6:1" "6:3" "6:2" "6:6" "9:1" "9:3" "9:6" "9:9"
)

generate_kustomization() {
    local node_count=1
    local shard_count=1
    local kustomization_file="kustomization.yaml"
    local base_yaml="mongodb-sharded-${node_count}-node"

    # Adjust file name if there are multiple shards
    [[ "$shard_count" -gt 1 ]] && base_yaml="${base_yaml}-${shard_count}-shards"
    base_yaml="${base_yaml}.yaml"

    # Validate topology
    local topology_key="${node_count}:${shard_count}"
    [[ ! " ${VALID_TOPOLOGIES[*]} " =~ ${topology_key} ]] && {
        echo "Error: Invalid topology - ${node_count} nodes, ${shard_count} shards"
        exit 1
    }

    # Generate base kustomization file
    cat > "$kustomization_file" << EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ./_build/root/deploy/${base_yaml}
patchesStrategicMerge:
EOF

    # Add configsvr patch with correct path to add volumeClaimTemplates
    cat >> "$kustomization_file" << EOF
- |-
  apiVersion: apps/v1
  kind: StatefulSet
  metadata:
    name: data-db-mongodb-sharded-configsvr
  spec:
    volumeClaimTemplates:
     - metadata:
         name: datadir
         annotations:
       spec:
         accessModes:
         - "ReadWriteOnce"
         resources:
           requests:
             storage: "8Gi"
         storageClassName: standard
EOF

    # Add shard patches for N shards with correct path to add volumeClaimTemplates
    for ((i=0; i<shard_count; i++)); do
        cat >> "$kustomization_file" << EOF
- |-
  apiVersion: apps/v1
  kind: StatefulSet
  metadata:
    name: data-db-mongodb-sharded-shard${i}-data
  spec:
    volumeClaimTemplates:
     - metadata:
         name: datadir
         annotations:
       spec:
         accessModes:
         - "ReadWriteOnce"
         resources:
           requests:
             storage: "8Gi"
         storageClassName: standard
EOF
    done

    cat "$kustomization_file"
}

generate_kustomization 1 2