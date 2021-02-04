#!/bin/sh

set -exu

NODE_IMAGE=${1:-kindest/node:v1.17.5@sha256:ab3f9e6ec5ad8840eeb1f76c89bb7948c77bbf76bcebe1a8b59790b8ae9a283a}
VOLUME_ROOT=${2:-/artifacts}
WORKER_NODE_COUNT=${3:-0}

add_workers() {
    local count=0
    while [ $count -lt $WORKER_NODE_COUNT ]; do
        count=$((count+1))
        echo "- role: worker
  image: ${NODE_IMAGE}
  extraMounts:
  - hostPath: ${VOLUME_ROOT}/data
    containerPath: /data"
    done
}

cat <<EOF | kind create cluster --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  image: ${NODE_IMAGE}
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraMounts:
  - hostPath: ${VOLUME_ROOT}/data
    containerPath: /data
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
$(add_workers)
EOF
