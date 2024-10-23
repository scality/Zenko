#! /bin/bash

set -exu

SCRIPT_FULL_PATH=$(readlink -f "$0")
DIR=$(dirname "$0")
REPOSITORY_DIR=$(dirname "$SCRIPT_FULL_PATH")/../../..
SOLUTION_BASE_DIR=$REPOSITORY_DIR/solution-base
VERSION_FILE="${REPOSITORY_DIR}/VERSION"

source "${VERSION_FILE}"

ZK_OPERATOR_VERSION=0.2.13
CERT_MANAGER_VERSION=v1.11.0
KAFKA_OPERATOR_VERSION=0.23.0
INGRESS_NGINX_VERSION=controller-v1.3.1
PROMETHEUS_VERSION=v0.52.1
KEYCLOAK_VERSION=18.4.4

MONGODB_ROOT_USERNAME=root
MONGODB_ROOT_PASSWORD=rootpass
MONGODB_APP_USERNAME=data
MONGODB_APP_PASSWORD=datapass
MONGODB_APP_DATABASE=${ZENKO_MONGODB_DATABASE:-datadb}
MONGODB_RS_KEY=0123456789abcdef

ENABLE_KEYCLOAK_HTTPS=${ENABLE_KEYCLOAK_HTTPS:-'false'}

KAFKA_CHART=banzaicloud-stable/kafka-operator

if [ $ENABLE_KEYCLOAK_HTTPS == 'true' ]; then
    KEYCLOAK_INGRESS_OPTIONS="$DIR/configs/keycloak_ingress_https.yaml"
else
    KEYCLOAK_INGRESS_OPTIONS="$DIR/configs/keycloak_ingress_http.yaml"
fi

# Older charts (bitnami/mongodb:7.8) have been removed from bitnami's helm repo: stick to the 
# commit before removal for now
helm repo add --force-update bitnami https://raw.githubusercontent.com/bitnami/charts/defb094c658024e4aa8245622dab202874880cbc/bitnami
helm repo add --force-update pravega https://charts.pravega.io
helm repo add --force-update codecentric https://codecentric.github.io/helm-charts/
# BanzaiCloud repo may not work, c.f. https://scality.atlassian.net/browse/AN-225
helm repo add --force-update banzaicloud-stable https://kubernetes-charts.banzaicloud.com || {
		echo -n "::notice file=$(basename $0),line=$LINENO,title=Banzaicloud Charts not available::"
		echo "Failed to add banzaicloud-stable repo, using local checkout"

		kafa_operator="$(mktemp -d)"
		git -c advice.detachedHead=false clone -q --depth 1 -b "v${KAFKA_OPERATOR_VERSION}" \
            https://github.com/banzaicloud/koperator "${kafa_operator}"

		KAFKA_CHART="${kafa_operator}/charts/kafka-operator"
	}
helm repo update

# nginx-controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/${INGRESS_NGINX_VERSION}/deploy/static/provider/kind/deploy.yaml
kubectl rollout status -n ingress-nginx deployment/ingress-nginx-controller --timeout=10m

# cert-manager
kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/${CERT_MANAGER_VERSION}/cert-manager.yaml --wait
# kubectl apply --validate=false -f - <<EOF
# apiVersion: cert-manager.io/v1
# kind: ClusterIssuer
# metadata:
#   name: artesca-root-ca-issuer
# spec:
#   selfSigned: {}
# EOF

# prometheus
# last-applied-configuration can end up larger than 256kB  which is too large for an annotation
# so if apply fails, replace can work
prom_url=https://raw.githubusercontent.com/coreos/prometheus-operator/${PROMETHEUS_VERSION}/bundle.yaml
kubectl create -f $prom_url || kubectl replace -f $prom_url --wait
# wait for the resource to exist
kubectl wait --for=condition=established --timeout=10m crd/alertmanagers.monitoring.coreos.com
envsubst < configs/prometheus.yaml | kubectl apply -f -

# zookeeper
helm upgrade --install --version ${ZK_OPERATOR_VERSION} -n default zk-operator pravega/zookeeper-operator --set "watchNamespace=default"

# kafka
kafka_crd_url=https://github.com/banzaicloud/koperator/releases/download/v${KAFKA_OPERATOR_VERSION}/kafka-operator.crds.yaml
kubectl create -f $kafka_crd_url || kubectl replace -f $kafka_crd_url
helm upgrade --install --version ${KAFKA_OPERATOR_VERSION} -n default kafka-operator ${KAFKA_CHART}

# keycloak
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
        mongo admin \
            -u $MONGODB_ROOT_USERNAME \
            -p $MONGODB_ROOT_PASSWORD \
            --quiet \
            --eval "db.runCommand({ listshards: 1 }).shards.length"
    )

    [ $count == "1" ]
}

mongodb_sharded() {
    local SOLUTION_REGISTRY=metalk8s-registry-from-config.invalid/zenko-base-${VERSION_FULL}

    kustomize edit set image \
        $SOLUTION_REGISTRY/mongodb-sharded=$(get_image_from_deps mongodb-sharded) \
        $SOLUTION_REGISTRY/os-shell=$(get_image_from_deps mongodb-shell) \
        $SOLUTION_REGISTRY/mongodb-exporter=$(get_image_from_deps mongodb-sharded-exporter)

    kubectl apply -k .

    kubectl rollout status statefulset data-db-mongodb-sharded-mongos
    kubectl rollout status statefulset data-db-mongodb-sharded-configsvr
    kubectl rollout status statefulset data-db-mongodb-sharded-shard0-data

    retry mongodb_wait_for_shards "no shards found"

    kubectl exec -t data-db-mongodb-sharded-mongos-0 -- \
        mongo admin \
            -u $MONGODB_ROOT_USERNAME \
            -p $MONGODB_ROOT_PASSWORD \
            --eval "sh.enableSharding('$MONGODB_APP_DATABASE')"
}

build_solution_base_manifests
mongodb_sharded

