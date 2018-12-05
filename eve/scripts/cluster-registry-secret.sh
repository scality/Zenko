#!/bin/sh
set -ex

DOCKERCONFIG="$(cat ~/.docker/config.json | base64 | tr -d \\n)"

cat >registry-secret.yml <<EOF
apiVersion: v1
data:
  .dockerconfigjson: "${DOCKERCONFIG}"
kind: Secret
metadata:
  name: registry
  namespace: "${NAMESPACE}"
type: kubernetes.io/dockerconfigjson
EOF

kubectl apply -f registry-secret.yml
kubectl patch --namespace=${NAMESPACE} serviceaccount default -p '{"imagePullSecrets": [{"name": "registry"}]}'
