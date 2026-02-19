#!/bin/sh

set -exu

NODE_IMAGE=${1:-kindest/node:v1.31.9@sha256:b94a3a6c06198d17f59cca8c6f486236fa05e2fb359cbd75dabbfc348a10b211}
VOLUME_ROOT=${2:-/artifacts}
WORKER_NODE_COUNT=${3:-0}
CLUSTER_NAME=${CLUSTER_NAME:-kind}
REG_NAME='kind-registry'
REG_PORT='5000'

create_registry() {
    echo "Creating local image registry on localhost:${REG_PORT}"

    if [ "$(docker inspect -f '{{.State.Running}}' "${REG_NAME}" 2>/dev/null)" != 'true' ]; then
        docker run \
            -d --restart=always -p "${REG_PORT}:5000" --name "${REG_NAME}" \
            registry:2
    fi
}

connect_registry() {
    local inspect_filter="{{range .Containers}}{{if eq .Name \"${REG_NAME}\"}}true{{end}}{{end}}"
    if [ "$(docker network inspect -f "${inspect_filter}" kind 2>/dev/null)" != 'true' ]; then
      docker network connect kind "${REG_NAME}"
    fi

    for node in $(kind get nodes --name ${CLUSTER_NAME}); do
      kubectl annotate --overwrite node "${node}" "kind.x-k8s.io/registry=localhost:${REG_PORT}";
    done
}

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
containerdConfigPatches: 
- |-
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:${REG_PORT}"]
    endpoint = ["http://${REG_NAME}:${REG_PORT}"]
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

enable_cgroup_controllers() {
  # containerd v2 (Docker 29+) only exposes cgroup controllers that are
  # explicitly enabled in the parent's subtree_control. On GitHub Actions
  # runners, systemd does not enable cpuset by default. KinD uses private
  # cgroup namespaces, so controllers must be enabled at every level of
  # the host hierarchy for containers to see them.
  # Without this, kubelet fails to init QOS cgroups and JDK runtimes NPE
  # on CgroupV2Subsystem.getInstance().
  #
  # Direct writes to subtree_control get reverted by systemd. Instead, we
  # use systemd's own mechanism: setting AllowedCPUs on docker.service
  # forces systemd to enable the cpuset controller in the cgroup hierarchy.
  if [ -f /sys/fs/cgroup/cgroup.controllers ]; then
    echo "=== cgroup v2 diagnostics (before) ==="
    echo "Root controllers: $(cat /sys/fs/cgroup/cgroup.controllers)"
    echo "Root subtree_control: $(cat /sys/fs/cgroup/cgroup.subtree_control)"
    cat /sys/fs/cgroup/system.slice/cgroup.subtree_control 2>/dev/null \
      && echo "system.slice subtree_control: $(cat /sys/fs/cgroup/system.slice/cgroup.subtree_control)" \
      || echo "system.slice subtree_control: not readable"

    NCPUS=$(($(nproc) - 1))
    echo "Enabling cpuset via systemd: AllowedCPUs=0-${NCPUS}"
    sudo systemctl set-property docker.service AllowedCPUs="0-${NCPUS}" || true

    echo "=== cgroup v2 diagnostics (after) ==="
    echo "Root subtree_control: $(cat /sys/fs/cgroup/cgroup.subtree_control)"
    cat /sys/fs/cgroup/system.slice/cgroup.subtree_control 2>/dev/null \
      && echo "system.slice subtree_control: $(cat /sys/fs/cgroup/system.slice/cgroup.subtree_control)" \
      || echo "system.slice subtree_control: not readable"
  fi
}

create_cluster() {
  if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "Kind cluster ${CLUSTER_NAME} already exists. Skipping creation."
    return
  fi

  kind create cluster --name=${CLUSTER_NAME} --config=config.yaml
}

create_registry
bootstrap_kind
enable_cgroup_controllers
create_cluster
connect_registry
