#!/bin/bash

# Only set strict mode when executed directly, not when sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    set -eu
fi

ZENKO_NAME="${ZENKO_NAME:-end2end}"
NAMESPACE="${NAMESPACE:-default}"

# --- Create missing Ingress resources ---

apply_ingress() {
    local name="$1"
    local host="$2"
    local service="$3"
    local port="${4:-name: http}"

    # Skip if an ingress already serves this host (e.g., from a prior Zenko instance in PRA)
    if kubectl get ingress -A -o jsonpath='{.items[*].spec.rules[*].host}' | grep -qw "${host}"; then
        echo "Ingress for ${host} already exists, skipping"
        return
    fi

    kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${name}
  namespace: ${NAMESPACE}
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "0"
spec:
  ingressClassName: nginx
  rules:
  - host: ${host}
    http:
      paths:
      - backend:
          service:
            name: ${service}
            port:
              ${port}
        path: /
        pathType: Prefix
EOF
}

# Backbeat API — used by node tests (CRR) and CTST
apply_ingress \
    "${ZENKO_NAME}-backbeat-api-ingress" \
    "backbeat-api.zenko.local" \
    "${ZENKO_NAME}-management-backbeat-api"

# Vault auth API — used by CTST
apply_ingress \
    "${ZENKO_NAME}-vault-auth-api-ingress" \
    "vault-auth.zenko.local" \
    "${ZENKO_NAME}-connector-vault-auth-api"

# Kafka Connect REST API — used by CTST notification tests
apply_ingress \
    "${ZENKO_NAME}-kafka-connect-ingress" \
    "kafka-connect.zenko.local" \
    "${ZENKO_NAME}-base-queue-connector" \
    "number: 8083"

# S3C (Ring) — only when metadata namespace exists (ENABLE_RING_TESTS=true)
if kubectl get namespace metadata &>/dev/null; then
    kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: s3c-ingress
  namespace: metadata
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "0"
spec:
  ingressClassName: nginx
  rules:
  - host: s3c.local
    http:
      paths:
      - backend:
          service:
            name: s3c-cloudserver
            port:
              number: 8000
        path: /
        pathType: Prefix
EOF
fi

# --- Wait for ingress controller to pick them up ---

if kubectl get ingress "${ZENKO_NAME}-backbeat-api-ingress" &>/dev/null; then
    kubectl wait --for=jsonpath='{.status.loadBalancer.ingress}' \
        ingress/${ZENKO_NAME}-backbeat-api-ingress \
        ingress/${ZENKO_NAME}-vault-auth-api-ingress \
        ingress/${ZENKO_NAME}-kafka-connect-ingress \
        --timeout=60s 2>/dev/null || true
fi

if kubectl get ingress s3c-ingress -n metadata &>/dev/null; then
    kubectl wait --for=jsonpath='{.status.loadBalancer.ingress}' \
        ingress/s3c-ingress -n metadata \
        --timeout=60s 2>/dev/null || true
fi

# --- /etc/hosts setup ---

ZENKO_HOSTS="\
    s3.zenko.local \
    iam.zenko.local \
    sts.zenko.local \
    management.zenko.local \
    keycloak.zenko.local \
    utilization.zenko.local \
    backbeat-api.zenko.local \
    vault-auth.zenko.local \
    kafka-connect.zenko.local \
    aws-mock.zenko.local \
    azure-mock.zenko.local \
    devstoreaccount1.blob.azure-mock.zenko.local \
    devstoreaccount1.queue.azure-mock.zenko.local \
    s3c.local \
    s3-local-file.zenko.local \
    website.mywebsite.com"

if ! grep -q "backbeat-api.zenko.local" /etc/hosts 2>/dev/null; then
    echo "127.0.0.1 ${ZENKO_HOSTS}" | sudo tee -a /etc/hosts
fi

# --- Export endpoint variables ---
# These use the ingress hostnames, reachable from outside the cluster.

export CLOUDSERVER_HOST="s3.zenko.local"
export CLOUDSERVER_ENDPOINT="http://s3.zenko.local"
export BACKBEAT_API_ENDPOINT="http://backbeat-api.zenko.local"
export VAULT_ENDPOINT="http://iam.zenko.local"
export VAULT_STS_ENDPOINT="http://sts.zenko.local"
export VAULT_AUTH_HOST="vault-auth.zenko.local"
export KAFKA_CONNECT_URL="http://kafka-connect.zenko.local/connectors"

echo "=== Endpoints configured for out-of-cluster access ==="
echo "  S3:             ${CLOUDSERVER_ENDPOINT}"
echo "  Backbeat API:   ${BACKBEAT_API_ENDPOINT}"
echo "  Vault IAM:      ${VAULT_ENDPOINT}"
echo "  Vault STS:      ${VAULT_STS_ENDPOINT}"
echo "  Vault Auth:     http://${VAULT_AUTH_HOST}"
echo "  Kafka Connect:  ${KAFKA_CONNECT_URL}"
