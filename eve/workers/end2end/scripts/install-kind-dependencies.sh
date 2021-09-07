#! /bin/sh

set -exu

DIR=$(dirname "$0")

ZK_OPERATOR_VERSION=v0.2.13
CERT_MANAGER_VERSION=v1.5.3
KUBEDB_VERSION=v2021.08.23
KAFKA_OPERATOR_VERSION=0.2.18
INGRESS_NGINX_VERSION=controller-v1.0.0
PROMETHEUS_VERSION=v0.50.0
KEYCLOAK_VERSION=15.0.2
ENABLE_KEYCLOAK_HTTPS=${ENABLE_KEYCLOAK_HTTPS:-'false'}

if [ $ENABLE_KEYCLOAK_HTTPS == 'true' ]; then
    KEYCLOAK_INGRESS_OPTIONS="$DIR/configs/keycloak_ingress_https.yaml"
else
    KEYCLOAK_INGRESS_OPTIONS="$DIR/configs/keycloak_ingress_http.yaml"
fi

# nginx-controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/${INGRESS_NGINX_VERSION}/deploy/static/provider/kind/deploy.yaml
kubectl rollout status -n ingress-nginx deployment/ingress-nginx-controller --timeout=10m

# zookeeper
kubectl apply -f https://raw.githubusercontent.com/pravega/zookeeper-operator/${ZK_OPERATOR_VERSION}/deploy/crds/zookeeper.pravega.io_zookeeperclusters_crd.yaml
kubectl apply -f https://raw.githubusercontent.com/pravega/zookeeper-operator/${ZK_OPERATOR_VERSION}/deploy/default_ns/rbac.yaml
kubectl apply -f https://raw.githubusercontent.com/pravega/zookeeper-operator/${ZK_OPERATOR_VERSION}/deploy/default_ns/operator.yaml

# cert-manager
kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/${CERT_MANAGER_VERSION}/cert-manager.yaml

# prometheus
kubectl apply -f https://raw.githubusercontent.com/coreos/prometheus-operator/${PROMETHEUS_VERSION}/bundle.yaml

# kafka
helm repo add banzaicloud-stable https://kubernetes-charts.banzaicloud.com/ && \
    helm upgrade --install --version ${KAFKA_OPERATOR_VERSION} -n default kafka-operator banzaicloud-stable/kafka-operator

# kubedb
helm repo add appscode https://charts.appscode.com/stable/ && \
    helm upgrade --install --version ${KUBEDB_VERSION} -n default kubedb-community appscode/kubedb-community

# keycloak
helm repo add codecentric https://codecentric.github.io/helm-charts/ && \
    helm upgrade --install --version ${KEYCLOAK_VERSION} keycloak codecentric/keycloak -f "$DIR/configs/keycloak_options.yaml" -f "${KEYCLOAK_INGRESS_OPTIONS}"

kubectl rollout status sts/keycloak --timeout=10m
