#!/bin/sh
set -ex

echo "Replacing existing credentials"
rm -rf /root/.kube
mkdir -p /root/.kube
echo "${CI_KUBECONFIG}" | envsubst > /root/.kube/config

echo "Setting up k8s namespace"
kubectl config get-contexts --kubeconfig ${KUBECONFIG}
kubectl config use-context admin-cluster.local || exit 1
kubectl get ns
kubectl create namespace "${NAMESPACE}"
kubectl create rolebinding view-configmap \
--clusterrole=cluster-admin \
--serviceaccount="${NAMESPACE}:default" \
--namespace="${NAMESPACE}"

echo "Configuring cluster registry secret"
$(dirname "$0")/cluster-registry-secret.sh
