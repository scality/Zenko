#!/bin/sh
set -e

script_full_path=$(readlink -f "$0")
file_dir=$(dirname "$script_full_path")/..

echo "Setting up k8s namespace"
kubectl config get-contexts
kubectl config use-context kubernetes-admin@kubernetes || exit 1
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
    release: zenko-test
subjects:
- kind: ServiceAccount
  name: zenko-test-cosmos-operator
  namespace: ${NAMESPACE}
roleRef:
  kind: ClusterRole
  name: zenko-test-cosmos-operator
  apiGroup: rbac.authorization.k8s.io
EOF

kubectl apply -f ${file_dir}/../end2end/manifests

## Todo: Add namespace wide quotas
#echo "Applying namespace quota"
#cat <<EOF | kubectl apply -f -
#apiVersion: v1
#kind: ResourceQuota
#metadata:
#  name: quota
#  namespace: ${NAMESPACE}
#spec:
#  hard:
#    cpu: "10"
#EOF
