#!/bin/sh

set -exu

NODE_IMAGE=${1:-kindest/node:v1.33.4@sha256:25a6018e48dfcaee478f4a59af81157a437f15e6e140bf103f85a2e7cd0cbbf2}
VOLUME_ROOT=${2:-/artifacts}
WORKER_NODE_COUNT=${3:-0}
CLUSTER_NAME=${CLUSTER_NAME:-kind}

add_workers() {
    local count=0
    while [ $count -lt $WORKER_NODE_COUNT ]; do
        count=$((count+1))
        echo "- role: worker
  image: ${NODE_IMAGE}
  extraMounts:
  - hostPath: ${VOLUME_ROOT}/data
    containerPath: /data
  - hostPath: ${HOME}/.docker/config.json
    containerPath: /var/lib/kubelet/config.json"
    done
}

bootstrap_kind() {
    cat > config.yaml << EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
networking:
  dnsSearch: []
nodes:
- role: control-plane
  image: ${NODE_IMAGE}
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  - |
    kind: ClusterConfiguration
    apiServer:
      extraArgs:
        event-ttl: "4h0m0s"
  extraMounts:
  - hostPath: ${VOLUME_ROOT}/data
    containerPath: /data
  - hostPath: ${HOME}/.docker/config.json
    containerPath: /var/lib/kubelet/config.json
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
$(add_workers)
EOF
}

needs_delegated_scope() {
  # When running rootless podman from a graphical terminal (e.g. GNOME/VTE),
  # cgroup controllers may not be delegated to the process's cgroup, causing
  # kind to fail. Detect this by checking what podman sees.
  # See https://kind.sigs.k8s.io/docs/user/rootless/#creating-a-kind-cluster-with-rootless-podman
  if [ "$(docker info --format '{{.Host.Security.Rootless}}' 2>/dev/null)" != "true" ]; then
    return 1
  fi
  controllers=$(docker info --format '{{.Host.CgroupControllers}}' 2>/dev/null) || return 1
  for c in cpu memory pids; do
    case "$controllers" in
      *"$c"*) ;;
      *) return 0 ;;
    esac
  done
  return 1
}

create_cluster() {
  if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "Kind cluster ${CLUSTER_NAME} already exists. Skipping creation."
    return
  fi

  DELEGATE=""
  if needs_delegated_scope; then
    echo "cgroup controllers not fully available, running kind under a delegated systemd scope"
    DELEGATE="systemd-run --user --scope --property=Delegate=yes"
  fi

  $DELEGATE kind create cluster --name=${CLUSTER_NAME} --config=config.yaml
}

bootstrap_kind
create_cluster
