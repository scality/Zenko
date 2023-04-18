#! /bin/sh

set -exu

SCRIPT_FULL_PATH=$(readlink -f "$0")
DIR=$(dirname "$0")
REPOSITORY_DIR=$(dirname "$SCRIPT_FULL_PATH")/../../..
SOLUTION_BASE_DIR=$REPOSITORY_DIR/solution-base
VERSION_FILE="${REPOSITORY_DIR}/VERSION"

source "${VERSION_FILE}"

ZK_OPERATOR_VERSION=0.2.13
CERT_MANAGER_VERSION=v1.6.1
KAFKA_OPERATOR_VERSION=0.23.0
INGRESS_NGINX_VERSION=controller-v1.1.0
PROMETHEUS_VERSION=v0.52.1
KEYCLOAK_VERSION=16.0.4
BITNAMI_MONGODB_VER=7.8.0

MONGODB_ROOT_USERNAME=root
MONGODB_ROOT_PASSWORD=rootpass
MONGODB_APP_USERNAME=data
MONGODB_APP_PASSWORD=datapass
MONGODB_APP_DATABASE=datadb
MONGODB_RS_KEY=0123456789abcdef
# force a 4.0 image as that's what artesca uses
DEPS_FILE="$DIR/../../../solution-base/deps.yaml"
MONGODB_IMAGE_TAG=$(yq eval ".mongodb.tag" $DEPS_FILE)
MONGODB_INIT_IMAGE_NAME=$(yq eval ".mongodb-shell.image" $DEPS_FILE)
MONGODB_INIT_IMAGE_TAG=$(yq eval ".mongodb-shell.tag" $DEPS_FILE)
MONGODB_EXPORTER_IMAGE_TAG=$(yq eval ".mongodb-exporter.tag" $DEPS_FILE)

ENABLE_KEYCLOAK_HTTPS=${ENABLE_KEYCLOAK_HTTPS:-'false'}
ZENKO_MONGODB_SHARDED=${ZENKO_MONGODB_SHARDED:-'false'}

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
helm repo add --force-update banzaicloud-stable https://kubernetes-charts.banzaicloud.com
helm repo update

# nginx-controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/${INGRESS_NGINX_VERSION}/deploy/static/provider/kind/deploy.yaml
kubectl rollout status -n ingress-nginx deployment/ingress-nginx-controller --timeout=10m

# cert-manager
kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/${CERT_MANAGER_VERSION}/cert-manager.yaml

# prometheus
# last-applied-configuration can end up larger than 256kB  which is too large for an annotation
# so if apply fails, replace can work
prom_url=https://raw.githubusercontent.com/coreos/prometheus-operator/${PROMETHEUS_VERSION}/bundle.yaml
kubectl create -f $prom_url || kubectl replace -f $prom_url

# zookeeper
helm upgrade --install --version ${ZK_OPERATOR_VERSION} -n default zk-operator pravega/zookeeper-operator --set "watchNamespace=default"

# kafka
kafka_crd_url=https://github.com/banzaicloud/koperator/releases/download/v${KAFKA_OPERATOR_VERSION}/kafka-operator.crds.yaml
kubectl create -f $kafka_crd_url || kubectl replace -f $kafka_crd_url
helm upgrade --install --version ${KAFKA_OPERATOR_VERSION} -n default kafka-operator banzaicloud-stable/kafka-operator

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
}

get_image_from_deps() {
    local dep_name=$1
    yq eval ".$dep_name | (.sourceRegistry // \"docker.io\") + \"/\" + .image + \":\" + .tag" $SOLUTION_BASE_DIR/deps.yaml
}

mongodb_replicaset() {
    ### TODO:  update to use chart in project
    kubectl create configmap \
        --from-file=${DIR}/../../../solution-base/mongodb/scripts mongodb-init-scripts \
        --dry-run=client -o yaml | kubectl apply -f -

    helm upgrade --install dev-db bitnami/mongodb \
        --version $BITNAMI_MONGODB_VER \
        -f "${DIR}/configs/mongodb_options.yaml"  \
        --set "volumePermissions.enabled=true" \
        --set "volumePermissions.image.repository=${MONGODB_INIT_IMAGE_NAME}" \
        --set "volumePermissions.image.tag=${MONGODB_INIT_IMAGE_TAG}" \
        --set "persistence.storageClass=standard" \
        --set "usePassword=true" \
        --set "mongodbRootPassword=$MONGODB_ROOT_PASSWORD" \
        --set "replicaSet.key=$MONGODB_RS_KEY" \
        --set "extraEnvVars[0].name=MONGODB_APP_USERNAME" \
        --set "extraEnvVars[0].value=$MONGODB_APP_USERNAME" \
        --set "extraEnvVars[1].name=MONGODB_APP_PASSWORD" \
        --set "extraEnvVars[1].value=$MONGODB_APP_PASSWORD" \
        --set "extraEnvVars[2].name=MONGODB_APP_DATABASE" \
        --set "extraEnvVars[2].value=$MONGODB_APP_DATABASE" \
        --set "extraEnvVars[3].name=MONGODB_NAMESPACE" \
        --set "extraEnvVars[3].value=default" \
        --set "replicaSet.pdb.minAvailable.secondary=1" \
        --set "replicaSet.pdb.minAvailable.arbiter=0" \
        --set "replicaSet.replicas.secondary=0" \
        --set "replicaSet.replicas.arbiter=0"

    kubectl rollout status statefulset dev-db-mongodb-primary
    kubectl rollout status statefulset dev-db-mongodb-secondary
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
        $SOLUTION_REGISTRY/bitnami-shell=$(get_image_from_deps mongodb-shell) \
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
if [ $ZENKO_MONGODB_SHARDED = 'true' ]; then
    mongodb_sharded
else
    mongodb_replicaset
fi

