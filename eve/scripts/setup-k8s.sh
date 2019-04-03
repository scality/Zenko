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

echo "Setup Cosmos operator cluster roles"
cat <<EOF | kubectl apply -f -
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: ${NAMESPACE}-cosmos-operator
  labels:
    app: cosmos-operator
    release: zenko-offline
subjects:
- kind: ServiceAccount
  name: zenko-offline-cosmos-operator
  namespace: ${NAMESPACE}
roleRef:
  kind: ClusterRole
  name: zenko-offline-cosmos-operator
  apiGroup: rbac.authorization.k8s.io
EOF

