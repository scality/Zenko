#!/bin/sh

set -exu

ZENKO_NAME=${1:-end2end}
E2E_IMAGE=${2:-registry.scality.com/zenko/zenko-e2e:latest}
NAMESPACE=${3:-default}

SERVICE_ACCOUNT="${ZENKO_NAME}-config"
POD_NAME="${ZENKO_NAME}-config"
MANAGEMENT_ENDPOINT="http://${ZENKO_NAME}-management-orbit-api:5001"
UUID=$(kubectl get zenko ${ZENKO_NAME} --namespace ${NAMESPACE} -o jsonpath='{.status.instanceID}')
KEY=$(kubectl get secret end2end-management-orbit-api-jwt-secret.v1 --namespace ${NAMESPACE} -o jsonpath='{.data.jwtUserSecret}' | base64 -d)

cat <<EOF | kubectl apply -f - 
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${SERVICE_ACCOUNT}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ${SERVICE_ACCOUNT}
rules:
- apiGroups:
  - ""
  resources:
  - secrets
  verbs:
  - '*'
---
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: ${SERVICE_ACCOUNT}
subjects:
- kind: ServiceAccount
  name: ${SERVICE_ACCOUNT}
roleRef:
  kind: Role
  name: ${SERVICE_ACCOUNT}
  apiGroup: rbac.authorization.k8s.io
EOF

kubectl run ${POD_NAME} \
  --image ${E2E_IMAGE} \
  -ti \
  --rm \
  --attach=True \
  --restart=Never \
  --namespace=${NAMESPACE} \
  --image-pull-policy=Always \
  --serviceaccount="${SERVICE_ACCOUNT}" \
  --env="KEY=${KEY}" \
  --env="UUID=${UUID}" \
  --env="MANAGEMENT_ENDPOINT=${MANAGEMENT_ENDPOINT}" \
  --env="NAMESPACE=${NAMESPACE}" \
  --command -- python3 configuration.py

kubectl wait --for condition=DeploymentFailure=false --timeout 10m -n ${NAMESPACE} zenko/${ZENKO_NAME}
kubectl wait --for condition=DeploymentInProgress=false --timeout 10m -n ${NAMESPACE} zenko/${ZENKO_NAME}
