#! /bin/sh

set -exu

DIR=$(dirname "$0")

ZK_OPERATOR_VERSION=v0.2.7
CERT_MANAGER_VERSION=v1.0.4
KUBEDB_VERSION=89fab34cf2f5d9e0bcc3c2d5b0f0599f94ff0dca
KAFKA_OPERATOR_VERSION=0.2.18
INGRESS_NGINX_VERSION=controller-v0.34.1
PROMETHEUS_VERSION=v0.38.2
KEYCLOAK_VERSION=9.0.5

# nginx-controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/${INGRESS_NGINX_VERSION}/deploy/static/provider/kind/deploy.yaml
kubectl rollout status -n ingress-nginx deployment/ingress-nginx-controller --timeout=10m

# zookeeper
kubectl apply -f https://raw.githubusercontent.com/pravega/zookeeper-operator/${ZK_OPERATOR_VERSION}/deploy/crds/zookeeper_v1beta1_zookeepercluster_crd.yaml
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
curl -fsSL https://raw.githubusercontent.com/kubedb/installer/${KUBEDB_VERSION}/deploy/kubedb.sh | bash

# keycloak
helm repo add codecentric https://codecentric.github.io/helm-charts/ && \
    helm upgrade --install --version ${KEYCLOAK_VERSION} keycloak codecentric/keycloak -f "$DIR/configs/keycloak_options.yaml"

kubectl rollout status sts/keycloak --timeout=10m
