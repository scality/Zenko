# Zenko Test Environment Setup

Simple scripts to setup and run tests against any Zenko cluster using Kubernetes Jobs.

## Quick Start

### 1. Setup Test Environment
```bash
# Using default kubeconfig
./setup-tests.sh

# Using specific kubeconfig
./setup-tests.sh /path/to/kubeconfig

# With custom options
./setup-tests.sh ~/.kube/config --no-metadata --no-tls
```

### 2. Run Tests
```bash
# Run CTST tests
./run-tests.sh ctst

# Run CTST with specific tags
./run-tests.sh ~/.kube/config ctst --tags @PRA
./run-tests.sh ~/.kube/config ctst --tags 'not @PRA'
```

## Environment Variables

Set these before running the scripts to customize behavior:

### Setup Configuration
```bash
export NAMESPACE="default"
export INSTANCE_ID="end2end"
export SUBDOMAIN="zenko.local"
export GIT_ACCESS_TOKEN="your-token"
export METADATA_NAMESPACE="metadata"
export SETUP_IMAGE="ghcr.io/scality/zenko-setup:latest"
export JOB_TIMEOUT="1800"
```

### Test Configuration  
```bash
# CTST and test images
export E2E_IMAGE="ghcr.io/scality/zenko/zenko-e2e:latest"
export E2E_CTST_IMAGE="ghcr.io/scality/zenko/zenko-e2e-ctst:latest"

# Keycloak configuration
export OIDC_REALM="zenko"
export OIDC_USERNAME="storage_manager"
export OIDC_PASSWORD="123"
export OIDC_HOST="keycloak.zenko.local"

# CTST specific configuration
export PARALLEL_RUNS="4"
export RETRIES="3"
export JUNIT_REPORT_PATH="ctst-junit.xml"

# Azure storage configuration
export AZURE_ACCOUNT_NAME="devstoreaccount1"
export AZURE_SECRET_KEY="Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw=="
```

## Requirements

- `kubectl` configured to access your cluster
