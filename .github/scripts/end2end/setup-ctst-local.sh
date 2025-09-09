#!/bin/bash
set -exu

# CTST Local Development Setup
# This script sets up minimal prerequisites for running CTST locally
# In the future, when CTST is the only test suite, this may be integrated into CTST itself

NAMESPACE=${1:-default}

echo "Setting up CTST local development environment..."

# 1. Grant CTST cluster-admin permissions (test environment only)
echo "Setting up CTST permissions..."
kubectl create clusterrolebinding ctst-cluster-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=default:default \
  --dry-run=client -o yaml | kubectl apply -f -

# 2. Check if CoreDNS needs patching for mock service resolution
echo "Checking CoreDNS configuration..."
if ! kubectl get configmap coredns -n kube-system -o yaml | grep -q "azure-mock.zenko.local" 2>/dev/null; then
    echo "Patching CoreDNS for mock service resolution..."
    bash patch-coredns.sh
else
    echo "CoreDNS already configured"
fi

# 3. Setup /etc/hosts for local development (requires sudo)
echo "Checking /etc/hosts configuration..."
if ! grep -q "zenko.local" /etc/hosts 2>/dev/null; then
    echo "Setting up /etc/hosts (requires sudo)..."
    echo "127.0.0.1 iam.zenko.local ui.zenko.local s3-local-file.zenko.local keycloak.zenko.local \
        sts.zenko.local management.zenko.local s3.zenko.local website.mywebsite.com utilization.zenko.local" | sudo tee -a /etc/hosts
else
    echo "/etc/hosts already configured"
fi

# 4. Wait for Zenko to be ready
echo "Waiting for Zenko deployment to be ready..."
kubectl wait --for condition=DeploymentFailure=false --timeout 10m zenko/end2end -n $NAMESPACE 2>/dev/null || echo "Zenko wait failed or not found"
kubectl wait --for condition=DeploymentInProgress=false --timeout 10m zenko/end2end -n $NAMESPACE 2>/dev/null || echo "Zenko wait failed or not found"

echo "CTST local environment ready!"
echo ""
echo "Usage:"
echo "  cd tests/ctst"
echo "  npm test                    # Run all CTST tests"
echo "  npm run test -- --tags @PRA # Run specific test tags"
echo ""
echo "Note: CTST will handle all Kubernetes setup (mocks, topics, deployments, etc.) automatically"