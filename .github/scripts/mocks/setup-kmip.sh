#!/bin/bash
# setup-kmip.sh — Deploy PyKMIP mock server for KMIP SSE testing.
# Idempotent
# 
# Deploys PyKMIP infra (certs, pod, service). The Zenko CR is patched
# by the CTST Before hook when @ServerSideEncryptionKmip tests start.

set -euo pipefail

ZENKO_NAME="${ZENKO_NAME:-end2end}"
NAMESPACE="${NAMESPACE:-default}"

if kubectl get deployment pykmip -n "${NAMESPACE}" &>/dev/null; then
    echo "PyKMIP already deployed, skipping"
    exit 0
fi

# 1. Certs + secrets

if kubectl get secret "${ZENKO_NAME}-kmip-certs" -n "${NAMESPACE}" &>/dev/null; then
    echo "KMIP secrets already exist, skipping cert generation"
else
    echo "Generating KMIP TLS certificates..."
    D=$(mktemp -d)
    trap 'rm -rf "$D"' EXIT

    openssl genrsa -out "$D/ca.key" 4096 2>/dev/null
    openssl req -new -x509 -key "$D/ca.key" -out "$D/ca.pem" \
        -days 3650 -subj "/CN=KMIP-CA" 2>/dev/null

    openssl genrsa -out "$D/server.key" 4096 2>/dev/null
    openssl req -new -key "$D/server.key" -out "$D/server.csr" \
        -subj "/CN=pykmip" 2>/dev/null
    openssl x509 -req -in "$D/server.csr" -CA "$D/ca.pem" -CAkey "$D/ca.key" \
        -CAcreateserial -out "$D/server.crt" -days 3650 \
        -extfile <(printf "subjectAltName=DNS:pykmip,DNS:pykmip.%s.svc.cluster.local" "$NAMESPACE") \
        2>/dev/null

    openssl genrsa -out "$D/client.key" 4096 2>/dev/null
    openssl req -new -key "$D/client.key" -out "$D/client.csr" \
        -subj "/CN=cloudserver-client" 2>/dev/null
    openssl x509 -req -in "$D/client.csr" -CA "$D/ca.pem" -CAkey "$D/ca.key" \
        -CAcreateserial -out "$D/client.crt" -days 3650 \
        -extfile <(printf "extendedKeyUsage=clientAuth") 2>/dev/null

    kubectl create secret generic "${ZENKO_NAME}-kmip-certs" \
        --from-file=ca.pem="$D/ca.pem" --from-file=cert.pem="$D/client.crt" \
        --from-file=key.pem="$D/client.key" \
        -n "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

    kubectl create secret generic pykmip-server-certs \
        --from-file=ca.crt="$D/ca.pem" --from-file=server.crt="$D/server.crt" \
        --from-file=server.key="$D/server.key" \
        -n "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
fi

# 2. PyKMIP startup script

kubectl create configmap pykmip-server-script -n "${NAMESPACE}" --dry-run=client -o yaml \
    --from-literal=run_pykmip.py='
import logging; from kmip.services.server import KmipServer
logging.basicConfig(level=logging.INFO)
server = KmipServer(hostname="0.0.0.0", port=5696,
    certificate_path="/certs/server.crt", key_path="/certs/server.key",
    ca_path="/certs/ca.crt", auth_suite="TLS1.2", config_path=None,
    enable_tls_client_auth=True, database_path="/tmp/pykmip.db")
with server: server.serve()
' | kubectl apply -f -

# 3. Deploy PyKMIP pod + service (inline YAML)

if ! kubectl get deployment pykmip -n "${NAMESPACE}" &>/dev/null; then
    kubectl apply -n "${NAMESPACE}" -f - <<'YAML'
apiVersion: v1
kind: Service
metadata:
  name: pykmip
spec:
  selector: { name: pykmip }
  ports: [{ name: kmip, port: 5696, targetPort: 5696 }]
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pykmip
  labels: { name: pykmip }
spec:
  replicas: 1
  selector:
    matchLabels: { name: pykmip }
  template:
    metadata:
      labels: { name: pykmip }
    spec:
      initContainers:
      - name: install
        image: docker.io/library/python:3.10-slim
        command: [pip, install, --target=/pykmip-libs, pykmip==0.10.0, -q]
        volumeMounts: [{ name: pykmip-libs, mountPath: /pykmip-libs }]
      containers:
      - name: pykmip
        image: docker.io/library/python:3.10-slim
        command: [python3, /scripts/run_pykmip.py]
        env: [{ name: PYTHONPATH, value: /pykmip-libs }]
        ports: [{ containerPort: 5696 }]
        readinessProbe:
          tcpSocket: { port: 5696 }
          initialDelaySeconds: 5
          periodSeconds: 3
        volumeMounts:
        - { name: certs, mountPath: /certs, readOnly: true }
        - { name: scripts, mountPath: /scripts, readOnly: true }
        - { name: pykmip-libs, mountPath: /pykmip-libs }
      volumes:
      - { name: certs, secret: { secretName: pykmip-server-certs } }
      - { name: scripts, configMap: { name: pykmip-server-script } }
      - { name: pykmip-libs, emptyDir: {} }
YAML
    echo "Waiting for PyKMIP..."
    kubectl wait --for=condition=Available deployment/pykmip -n "${NAMESPACE}" --timeout=5m
else
    echo "PyKMIP already deployed"
fi

echo "PyKMIP infra ready"
