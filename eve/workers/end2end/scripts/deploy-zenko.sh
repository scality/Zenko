#!/bin/sh

set -exu

ZENKO_NAME=${1:-end2end}
VOLUME_ROOT=${2:-/artifacts}
NAMESPACE=${3:-default}

ZENKO_VERSION_NAME="${ZENKO_NAME}-version"
MONGODB_PV_NAME="${ZENKO_NAME}-mongdb-0"
REDIS_PV_NAME="${ZENKO_NAME}-redis-0"
KAFKA_PV_NAME="${ZENKO_NAME}-kafka-0"
ZOOKEEPER_PV_NAME="${ZENKO_NAME}-zookeeper-0"
LOCALDATA_PV_NAME="${ZENKO_NAME}-localdata-0"
PV_LIST=" \
  $MONGODB_PV_NAME \
  $REDIS_PV_NAME \
  $KAFKA_PV_NAME \
  $ZOOKEEPER_PV_NAME \
  $LOCALDATA_PV_NAME \
"

prepare_volumes() {
  for PV in ${PV_LIST}; do
    local path="/data/${PV}"
    local dir="${VOLUME_ROOT}${path}"

    if test -d "${dir}" ; then
        echo "directory already exists: '${dir}'"
        exit 1
    fi
    mkdir -p ${dir}
    chmod 777 ${dir}

    cat << EOF | kubectl apply -f -
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: ${PV}
spec:
  storageClassName: "standard"
  persistentVolumeReclaimPolicy: Recycle
  capacity:
    storage: 20Gi
  accessModes:
  - ReadWriteOnce
  hostPath:
    path: ${path}
    type: Directory
EOF
  done
}

create_zenko_instance() {
  cat <<EOF | kubectl apply -f -
---
apiVersion: zenko.io/v1alpha1
kind: ZenkoVersion
metadata:
  name: ${ZENKO_VERSION_NAME}
  namespace: ${NAMESPACE}
spec:
  imagePullPolicy: Always
  versions:
    management:
      ui:
        image: registry.scality.com/sf-eng/zenko-ui
        tag: 'c091051'
    cloudserver:
      image: registry.scality.com/zenko/cloudserver
      tag: latest-8.1.2
    backbeat:
      image: registry.scality.com/zenko/backbeat
      tag: latest-8.2.5
    utapi:
      image: registry.scality.com/sf-eng/utapi
      tag: zenko-1.0.0
    secureChannelProxy:
      image: registry.scality.com/zenko/cloudserver
      tag: latest-8.1.2
    localData:
      image: registry.scality.com/zenko/cloudserver
      tag: latest-8.1.2
    metrics:
      image: registry.scality.com/zenko/cloudserver
      tag: latest-8.1.2
    s3utils:
      image: registry.scality.com/zenko/s3utils
      tag: '8199470'
    zookeeper:
      image: pravega/zookeeper
      tag: 0.2.4
    kafka:
      image: wurstmeister/kafka
      tag: 2.12-2.3.0
    shell:
      image: busybox
      tag: 1.31.0-glibc
    mongodb: '4.0-v1'
    redis:
      kubedb: '5.0.3-v1'
---
apiVersion: zenko.io/v1alpha1
kind: Zenko
metadata:
  name: ${ZENKO_NAME}
  namespace: ${NAMESPACE}
spec:
  version: ${ZENKO_VERSION_NAME}
  replicas: 1
  mongodb:
    provider: KubeDB
    persistence:
      existingPersistentVolume: ${MONGODB_PV_NAME}
  redis:
    provider: KubeDB
    persistence:
      existingPersistentVolume: ${REDIS_PV_NAME}
  kafka:
    provider: Managed
    persistence:
      existingPersistentVolume: ${KAFKA_PV_NAME}
  zookeeper:
    provider: Managed
    persistence:
      existingPersistentVolume: ${ZOOKEEPER_PV_NAME}
  localData:
    persistence:
      existingPersistentVolume: ${LOCALDATA_PV_NAME}
  management:
    provider: InCluster
    oidc:
      discoveryUrl: 'http://keycloak.local/auth/realms/z2/.well-known/openid-configuration'
      uiClientId: ui
      vaultClientId: vault
    api:
      allowFrom:
      - 172.16.0.0/12
      - 10.0.0.0/8
  registry:
    imagePullSecretNames:
    - zenko-operator-image-pull
EOF

  kubectl wait --for condition=Available --timeout 10m --namespace ${NAMESPACE} zenko/${ZENKO_NAME}
}

prepare_volumes
create_zenko_instance
