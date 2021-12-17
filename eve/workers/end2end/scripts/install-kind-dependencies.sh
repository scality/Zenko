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

ENABLE_KEYCLOAK_HTTPS=${ENABLE_KEYCLOAK_HTTPS:-'false'}

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
