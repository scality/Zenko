#! /bin/sh

set -exu

DIR=$(dirname "$0")

ZK_OPERATOR_VERSION=0.2.13
CERT_MANAGER_VERSION=v1.6.1
KAFKA_OPERATOR_VERSION=0.20.1
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
DEPS_FILE="$DIR/../../../../solution-base/deps.yaml"
MONGODB_IMAGE_TAG=$(yq eval ".mongodb.tag" $DEPS_FILE)
MONGODB_INIT_IMAGE_REGISTRY=$(yq eval ".mongodb-minideb.sourceRegistry" $DEPS_FILE)
MONGODB_INIT_IMAGE_NAME=$(yq eval ".mongodb-minideb.image" $DEPS_FILE)
MONGODB_INIT_IMAGE_TAG=$(yq eval ".mongodb-minideb.tag" $DEPS_FILE)
MONGODB_EXPORTER_IMAGE_TAG=$(yq eval ".mongodb-exporter.tag" $DEPS_FILE)
MONGODB_SHARDED_IMAGE_TAG=$(yq eval ".mongodb-sharded.tag" $DEPS_FILE)
MONGODB_SHARDED_EXPORTER_IMAGE_TAG=$(yq eval ".mongodb-sharded-exporter.tag" $DEPS_FILE)
MONGODB_SHARDED_SHELL_IMAGE_TAG=$(yq eval ".mongodb-sharded-shell.tag" $DEPS_FILE)

ENABLE_KEYCLOAK_HTTPS=${ENABLE_KEYCLOAK_HTTPS:-'false'}
ZENKO_MONGODB_SHARDED=${ZENKO_MONGODB_SHARDED:-'false'}

if [ $ENABLE_KEYCLOAK_HTTPS == 'true' ]; then
    KEYCLOAK_INGRESS_OPTIONS="$DIR/configs/keycloak_ingress_https.yaml"
else
    KEYCLOAK_INGRESS_OPTIONS="$DIR/configs/keycloak_ingress_http.yaml"
fi

helm repo add --force-update bitnami https://charts.bitnami.com/bitnami
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
kubectl create --validate=false -f https://github.com/banzaicloud/koperator/releases/download/v${KAFKA_OPERATOR_VERSION}/kafka-operator.crds.yaml
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

mongodb_replicaset() {
    ### TODO:  update to use chart in project
    kubectl create configmap \
        --from-file=${DIR}/configs/mongodb_init_scripts mongodb-init-scripts \
        --dry-run=client -o yaml | kubectl apply -f -

    helm upgrade --install dev-db bitnami/mongodb \
        --version $BITNAMI_MONGODB_VER \
        -f "${DIR}/configs/mongodb_options.yaml"  \
        --set "volumePermissions.enabled=true" \
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

mongodb_sharded() {
    local CHART_PATH="$(dirname $0)/../../../../solution-base/mongodb/charts/mongodb-sharded"

    helm upgrade --install dev-db ${CHART_PATH} -n default \
        --set global.storageClass=standard \
        --set shards=1 \
        --set mongos.replicas=1 \
        --set mongos.useStatefulSet=true \
        --set shardsvr.dataNode.replicas=3 \
        --set shardsvr.persistence.enabled=true \
        --set shardsvr.persistence.storageClass=standard \
        --set configsvr.replicas=3 \
        --set configsvr.persistence.enabled=true \
        --set configsvr.persistence.storageClass=standard \
        --set metrics.enabled=true \
        --set common.initScriptsCM=mongodb-sharded-init-scripts \
        --set volumePermissions.enabled=true \
        --set image.tag=${MONGODB_SHARDED_IMAGE_TAG} \
        --set metrics.image.tag=${MONGODB_SHARDED_EXPORTER_IMAGE_TAG} \
        --set volumePermissions.image.tag=${MONGODB_SHARDED_SHELL_IMAGE_TAG} \
        --set existingSecret=mongodb-db-creds

    kubectl rollout status statefulset dev-db-mongodb-sharded-mongos
    kubectl rollout status statefulset dev-db-mongodb-sharded-configsvr
    kubectl rollout status statefulset dev-db-mongodb-sharded-shard0-data

    kubectl exec -t dev-db-mongodb-sharded-mongos-0 -- \
        mongo admin \
            -u $MONGODB_ROOT_USERNAME \
            -p $MONGODB_ROOT_PASSWORD \
            --eval "sh.enableSharding('$MONGODB_APP_DATABASE')"
}

if [ $ZENKO_MONGODB_SHARDED = 'true' ]; then
    mongodb_sharded
else
    mongodb_replicaset
fi

