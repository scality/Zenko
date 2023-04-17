#!/bin/sh

set -exu

NODE_IMAGE=${1:-kindest/node:v1.23.4@sha256:0e34f0d0fd448aa2f2819cfd74e99fe5793a6e4938b328f657c8e3f81ee0dfb9}
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

create_cluster() {
  kind create cluster --name=${CLUSTER_NAME} --config=config.yaml
}

create_registry
bootstrap_kind
create_cluster
connect_registry
