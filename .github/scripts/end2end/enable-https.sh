#!/bin/sh

set -exu

# This script enables HTTPS for an existing HTTP deployment of Zenko
DIR=$(dirname "$0")
KEYCLOAK_VERSION=${KEYCLOAK_VERSION:-'18.4.4'}

# Create a self-signed certificate for Zenko ingresses
kubectl apply -f - << EOF
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: zenko-tls
  namespace: default
spec:
  secretName: zenko-tls
  issuerRef:
    name: artesca-root-ca-issuer
    kind: ClusterIssuer
  dnsNames:
  - management.zenko.local
  - s3.zenko.local
  - iam.zenko.local
  - sts.zenko.local
  - keycloak.zenko.local
EOF

# Wait for certificate to be ready
kubectl wait --for=condition=Ready --timeout=2m certificate/zenko-tls

# Get current Zenko instance name
ZENKO_NAME=$(kubectl get zenko -o jsonpath='{.items[0].metadata.name}')
NAMESPACE="default"

# Update Zenko CR to include TLS certificates
kubectl patch zenko/${ZENKO_NAME} --type=merge -p '{
  "spec": {
    "ingress": {
      "certificates": [
        {
          "hosts": [
            "management.zenko.local",
            "iam.zenko.local",
            "sts.zenko.local",
            "s3.zenko.local"
          ],
          "secretName": "zenko-tls"
        }
      ],
      "annotations": {
        "nginx.ingress.kubernetes.io/proxy-body-size": "0m",
        "nginx.ingress.kubernetes.io/ssl-redirect": "false"
      }
    }
  }
}'

# Wait for Zenko to be updated
kubectl wait --for condition=Available --timeout 5m zenko/${ZENKO_NAME}

# Update environment variables to use HTTPS URLs
echo "OIDC_ENDPOINT=https://keycloak.zenko.local" >> $GITHUB_ENV
echo "OIDC_HOST=keycloak.zenko.local" >> $GITHUB_ENV
echo "ENABLE_KEYCLOAK_HTTPS=true" >> $GITHUB_ENV

# Set the HTTPS ingress options for Keycloak
KEYCLOAK_INGRESS_OPTIONS="$DIR/configs/keycloak_ingress_https.yaml"
KEYCLOAK_OPTIONS="$DIR/configs/keycloak_options.yaml"
helm upgrade --install keycloak codecentric/keycloak -f "${KEYCLOAK_OPTIONS}" -f "${KEYCLOAK_INGRESS_OPTIONS}" --version ${KEYCLOAK_VERSION}
kubectl rollout status sts/keycloak --timeout=5m

echo "HTTPS successfully enabled for Zenko deployment"
