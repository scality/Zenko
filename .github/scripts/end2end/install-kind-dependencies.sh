#! /bin/bash

set -exu

SCRIPT_FULL_PATH=$(readlink -f "$0")
DIR=$(dirname "$0")
REPOSITORY_DIR=$(dirname "$SCRIPT_FULL_PATH")/../../..
SOLUTION_BASE_DIR=$REPOSITORY_DIR/solution-base
VERSION_FILE="${REPOSITORY_DIR}/VERSION"

source "${VERSION_FILE}"

ZK_OPERATOR_VERSION=0.2.15-adobe-20250923
ZK_OPERATOR_CHART=oci://ghcr.io/adobe/helm-charts/zookeeper-operator
CERT_MANAGER_VERSION=v1.13.3
KAFKA_OPERATOR_VERSION=0.28.0-adobe-20251203
KAFKA_OPERATOR_CHART=oci://ghcr.io/adobe/helm-charts/kafka-operator
INGRESS_NGINX_VERSION=controller-v1.10.3
PROMETHEUS_VERSION=v0.52.1
KEYCLOAK_VERSION=${KEYCLOAK_VERSION:-'18.4.4'}

MONGODB_ROOT_USERNAME=root
MONGODB_ROOT_PASSWORD=rootpass
MONGODB_APP_USERNAME=data
MONGODB_APP_PASSWORD=datapass
MONGODB_APP_DATABASE=${ZENKO_MONGODB_DATABASE:-datadb}
MONGODB_RS_KEY=0123456789abcdef

# Constants for valid topologies for CI tests
# We support multiple shards per host, or one shard per host, up to 9 nodes
# The first number is the number of nodes, the second is the number of shards
readonly MONGODB_VALID_TOPOLOGIES=(
    "1:1" "1:2" "3:1" "3:3" "6:1" "6:2" "6:6" "9:1" "9:3" "9:9" "12:1" "12:4" "12:12"
)

MONGODB_SHARD_COUNT=${MONGODB_SHARD_COUNT:-1}

ENABLE_KEYCLOAK_HTTPS=${ENABLE_KEYCLOAK_HTTPS:-'false'}

if [ $ENABLE_KEYCLOAK_HTTPS == 'true' ]; then
    KEYCLOAK_INGRESS_OPTIONS="$DIR/configs/keycloak_ingress_https.yaml"
else
    KEYCLOAK_INGRESS_OPTIONS="$DIR/configs/keycloak_ingress_http.yaml"
fi

helm repo add --force-update codecentric https://codecentric.github.io/helm-charts/

# nginx-controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/${INGRESS_NGINX_VERSION}/deploy/static/provider/kind/deploy.yaml
kubectl rollout status -n ingress-nginx deployment/ingress-nginx-controller --timeout=10m

# cert-manager
kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/${CERT_MANAGER_VERSION}/cert-manager.yaml --wait
kubectl rollout status -n cert-manager deployment/cert-manager-webhook --timeout=10m

# === CERTIFICATE AUTHORITY SETUP ===
# We need a self-signed root CA certificate for signing certificates for mock services
# (Azure mock, AWS mock). This enables HTTPS testing with proper certificate validation.

echo "Waiting for cert-manager webhook to be ready..."
kubectl wait --for=condition=Available --timeout=60s deployment/cert-manager-webhook -n cert-manager

cat <<'EOF' | kubectl apply -f -
---
# Bootstrap self-signed ClusterIssuer for creating the root CA
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: bootstrap-selfsigned
spec:
  selfSigned: {}
---
# Root CA certificate that will act as our custom CA
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: root-ca
  namespace: cert-manager
spec:
  secretName: root-ca
  isCA: true
  commonName: root-ca
  issuerRef:
    name: bootstrap-selfsigned
    kind: ClusterIssuer
---
# Production ClusterIssuer that uses our root CA for signing service certificates
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: artesca-root-ca-issuer
spec:
  ca:
    secretName: root-ca
EOF

kubectl wait --for=condition=Ready --timeout=240s certificate/root-ca -n cert-manager
kubectl wait --for=condition=Ready --timeout=240s clusterissuer/artesca-root-ca-issuer

# Copy root CA secret to default namespace for applications to use
echo "Copying root CA certificate to default namespace..."
kubectl get secret root-ca -n cert-manager -o json | 
  jq '.metadata.namespace="default" | .metadata.name="zenko-root-ca"' | 
  kubectl apply -f -

# prometheus
# last-applied-configuration can end up larger than 256kB  which is too large for an annotation
# so if apply fails, replace can work
prom_url=https://raw.githubusercontent.com/coreos/prometheus-operator/${PROMETHEUS_VERSION}/bundle.yaml
kubectl create -f $prom_url || kubectl replace -f $prom_url --wait
# wait for the resource to exist
kubectl wait --for=condition=established --timeout=10m crd/alertmanagers.monitoring.coreos.com
envsubst < configs/prometheus.yaml | kubectl apply -f -

# zookeeper
# Use Adobe's OCI Helm chart from GitHub Container Registry
helm upgrade --install --version ${ZK_OPERATOR_VERSION} -n default zk-operator ${ZK_OPERATOR_CHART} --set "watchNamespace=default"

# kafka (also requires Contour CRDs)
kubectl apply -f https://raw.githubusercontent.com/projectcontour/contour/refs/heads/main/examples/contour/01-crds.yaml
for crd in cruisecontroloperations kafkaclusters kafkatopics kafkausers ; do
    kafka_crd_url=https://github.com/adobe/koperator/raw/refs/tags/${KAFKA_OPERATOR_VERSION}/config/base/crds/kafka.banzaicloud.io_${crd}.yaml
    kubectl create -f $kafka_crd_url || kubectl replace -f $kafka_crd_url
done
helm upgrade --install --version ${KAFKA_OPERATOR_VERSION} -n default kafka-operator ${KAFKA_OPERATOR_CHART} \
    --set prometheusMetrics.authProxy.image.repository=quay.io/brancz/kube-rbac-proxy \
    --set prometheusMetrics.authProxy.image.tag=v0.21.0

# keycloak
envsubst < $DIR/configs/keycloak_config.json > $DIR/configs/keycloak-realm.json
kubectl create configmap keycloak-realm --from-file=$DIR/configs/keycloak-realm.json
helm upgrade --install --version ${KEYCLOAK_VERSION} keycloak codecentric/keycloak -f "$DIR/configs/keycloak_options.yaml" -f "${KEYCLOAK_INGRESS_OPTIONS}"

kubectl rollout status sts/keycloak --timeout=10m


# TODO: use zenko-operator install-deps
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: mongodb-db-creds
stringData:
  mongodb-root-username: $MONGODB_ROOT_USERNAME
  mongodb-root-password: $MONGODB_ROOT_PASSWORD 
  mongodb-username: $MONGODB_APP_USERNAME
  mongodb-password: $MONGODB_APP_PASSWORD 
  mongodb-database: $MONGODB_APP_DATABASE
  mongodb-replica-set-key: $MONGODB_RS_KEY
EOF

# Validate that the current topology is correct
get_mongodb_topology_file() {
    local node_count=$1
    local shard_count=$2

    local base_yaml_name="mongodb-sharded-${node_count}-node"

    # Validate topology
    local topology_key="${node_count}:${shard_count}"
    if [[ ! " ${MONGODB_VALID_TOPOLOGIES[*]} " =~ " ${topology_key} " ]]; then
        echo "Error: Invalid topology - ${node_count} nodes, ${shard_count} shards"
        exit 1
    fi

    # Adjust base YAML name if there are multiple shards
    [[ "$shard_count" -gt 1 ]] && base_yaml_name="${base_yaml_name}-${shard_count}-shards"
    base_yaml_name="${base_yaml_name}.yaml"

    # ensure base file exists
    local base_yaml_path="${DIR}/_build/root/deploy/${base_yaml_name}"
    if [ ! -f "$base_yaml_path" ]; then
        echo "Error: Base YAML file not found at ${base_yaml_path}"
        exit 1
    fi

    echo "$base_yaml_path"
}

# MongoDB selectors are not supported in the CI.
# So we remove them and let the provisioner handle the
# volume provisioning.
patch_mongodb_selector() {
    local base_yaml_path=$1
    local shard_count=$2

    # Remove volume selectors from mongos StatefulSet
    yq eval 'select(.kind == "StatefulSet" and .metadata.name == "data-db-mongodb-sharded-mongos") |= del(.spec.volumeClaimTemplates[].spec.selector)' -i "$base_yaml_path"
    
    # Remove volume selectors from configsvr StatefulSet  
    yq eval 'select(.kind == "StatefulSet" and .metadata.name == "data-db-mongodb-sharded-configsvr") |= del(.spec.volumeClaimTemplates[].spec.selector)' -i "$base_yaml_path"
    
    # Remove volume selectors from shard StatefulSets
    for ((i=0; i<shard_count; i++)); do
        yq eval "select(.kind == \"StatefulSet\" and .metadata.name == \"data-db-mongodb-sharded-shard${i}-data\") |= del(.spec.volumeClaimTemplates[].spec.selector)" -i "$base_yaml_path"
    done
}

build_solution_base_manifests() {
    echo 'build solution-base manifests'
    MANIFEST_ONLY=true $SOLUTION_BASE_DIR/build.sh
    sed -i 's/SOLUTION_ENV/default/g' $DIR/_build/root/deploy/*
    sed -i 's/MONGODB_STORAGE_CLASS/standard/g' $DIR/_build/root/deploy/*

    # Limits and requests for MongoDB are computed based on the current system
    # Detect total system RAM in GiB
    TOTAL_RAM_GB=$(awk '/MemTotal/ {printf "%.0f", $2/1024/1024}' /proc/meminfo)
  
    # Compute MongoDB settings based on the total RAM
    MONGODB_WIRETIGER_CACHE_SIZE_GB=$((TOTAL_RAM_GB * 335 / 1000))
    MONGODB_MONGOS_RAM_LIMIT=$((TOTAL_RAM_GB * 165 / 1000))Gi
    MONGODB_SHARDSERVER_RAM_LIMIT=$((2 * MONGODB_WIRETIGER_CACHE_SIZE_GB))Gi
    MONGODB_SHARDSERVER_RAM_REQUEST=${MONGODB_WIRETIGER_CACHE_SIZE_GB}Gi
    MONGODB_MONGOS_RAM_REQUEST=$((TOTAL_RAM_GB * 33 / 1000))Gi

    # Replace values before deploying
    sed -i "s/MONGODB_SHARDSERVER_EXTRA_FLAGS/--wiredTigerCacheSizeGB=${MONGODB_WIRETIGER_CACHE_SIZE_GB}/g" $DIR/_build/root/deploy/*
    sed -i "s/MONGODB_MONGOS_RAM_LIMIT/${MONGODB_MONGOS_RAM_LIMIT}/g" $DIR/_build/root/deploy/*
    sed -i "s/MONGODB_SHARDSERVER_RAM_LIMIT/${MONGODB_SHARDSERVER_RAM_LIMIT}/g" $DIR/_build/root/deploy/*
    sed -i "s/MONGODB_SHARDSERVER_RAM_REQUEST/${MONGODB_SHARDSERVER_RAM_REQUEST}/g" $DIR/_build/root/deploy/*
    sed -i "s/MONGODB_MONGOS_RAM_REQUEST/${MONGODB_MONGOS_RAM_REQUEST}/g" $DIR/_build/root/deploy/*
}

get_image_from_deps() {
    local dep_name=$1
    yq eval ".$dep_name | (.sourceRegistry // \"docker.io\") + \"/\" + .image + \":\" + .tag" $SOLUTION_BASE_DIR/deps.yaml
}

retry() {
    local count=0
    local errMsg=${1:-'reached max retry attempts'}

    while ! "$@" && [ $count -lt 10 ]; do
        count=$(($count + 1))
        sleep 5
    done

    if [ $count -ge 10 ]; then
        echo $errMsg
        exit 1
    fi
}

mongodb_wait_for_shards() {
    local count=$(kubectl exec -t data-db-mongodb-sharded-mongos-0 -- \
        mongosh admin \
            -u $MONGODB_ROOT_USERNAME \
            -p $MONGODB_ROOT_PASSWORD \
            --quiet \
            --eval "db.runCommand({ listshards: 1 }).shards.length"
    )

    [ $count == "$MONGODB_SHARD_COUNT" ]
}

mongodb_sharded() {
    local SOLUTION_REGISTRY=metalk8s-registry-from-config.invalid/zenko-base-${VERSION_FULL}
    local node_count=${NODE_COUNT:-1}
    local shard_count=${MONGODB_SHARD_COUNT}

    local base_yaml_path=$(get_mongodb_topology_file $node_count $shard_count)

    sed -i "s|${SOLUTION_REGISTRY}/mongodb-sharded:.*|$(get_image_from_deps mongodb-sharded)|g" "$base_yaml_path"
    sed -i "s|${SOLUTION_REGISTRY}/os-shell:.*|$(get_image_from_deps mongodb-shell)|g" "$base_yaml_path"
    sed -i "s|${SOLUTION_REGISTRY}/mongodb-exporter:.*|$(get_image_from_deps mongodb-sharded-exporter)|g" "$base_yaml_path"

    # Ensure we use no selector as the provisioner cannot handle them
    patch_mongodb_selector "$base_yaml_path" "$shard_count"

    kubectl apply -f "$base_yaml_path"

    kubectl rollout status statefulset data-db-mongodb-sharded-mongos --timeout=5m
    kubectl rollout status statefulset data-db-mongodb-sharded-configsvr --timeout=5m

    for ((i=0; i<MONGODB_SHARD_COUNT; i++)); do
        kubectl rollout status statefulset "data-db-mongodb-sharded-shard${i}-data" --timeout=5m
    done

    retry mongodb_wait_for_shards "no shards found"

    kubectl exec -t data-db-mongodb-sharded-mongos-0 -- \
        mongosh admin \
            -u $MONGODB_ROOT_USERNAME \
            -p $MONGODB_ROOT_PASSWORD \
            --eval "sh.enableSharding('$MONGODB_APP_DATABASE')"
}

build_solution_base_manifests
mongodb_sharded

