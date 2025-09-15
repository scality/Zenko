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
# Run CTST tests (default)
./run-tests.sh

# Run specific test type
./run-tests.sh ~/.kube/config ctst
./run-tests.sh ~/.kube/config e2e
./run-tests.sh ~/.kube/config smoke

# Run CTST with specific tags
./run-tests.sh ~/.kube/config ctst --tags @PRA
./run-tests.sh ~/.kube/config ctst --tags 'not @PRA'
```

## Environment Variables

Set these before running the scripts to customize behavior:

### Setup Configuration
```bash
export NAMESPACE="default"              # Kubernetes namespace
export INSTANCE_ID="end2end"           # Zenko instance name  
export SUBDOMAIN="zenko.local"         # Base domain for services
export GIT_ACCESS_TOKEN="your-token"   # For metadata deployment
export METADATA_NAMESPACE="metadata"   # Metadata service namespace
export SETUP_IMAGE="ghcr.io/scality/zenko-setup:latest"  # Setup container image
export LOG_LEVEL="debug"               # Logging verbosity
export JOB_TIMEOUT="1800"              # Job timeout in seconds
```

### Test Configuration  
```bash
export E2E_IMAGE="ghcr.io/scality/zenko/zenko-e2e:latest"       # E2E test container
export E2E_CTST_IMAGE="ghcr.io/scality/zenko/zenko-e2e-ctst:latest" # CTST test container
export OIDC_REALM="zenko"                   # Keycloak realm
export OIDC_USERNAME="storage_manager"     # Test user
export OIDC_PASSWORD="123"                 # Test password
export OIDC_HOST="keycloak.zenko.local"    # Keycloak hostname

# CTST-specific configuration
export PARALLEL_RUNS="4"                   # Number of parallel test runs
export RETRIES="3"                         # Test retry count
export JUNIT_REPORT_PATH="ctst-junit.xml"  # JUnit report path
export AZURE_ACCOUNT_NAME="devstoreaccount1"  # Azure storage account
export AZURE_SECRET_KEY="..."              # Azure storage key
```

## Requirements

- `kubectl` configured to access your cluster
- Appropriate RBAC permissions in the target cluster (created automatically)

## How It Works

1. **Setup Script** (`./setup-tests.sh`):
   - Creates RBAC permissions (ServiceAccount + ClusterRoleBinding) 
   - Runs a Kubernetes Job with the zenko-setup container
   - Configures buckets, accounts, endpoints, workflows, TLS, etc.
   - Waits for Zenko to stabilize

2. **Test Script** (`./run-tests.sh`):  
   - Verifies Zenko is deployed and ready
   - Runs test containers as Kubernetes Jobs
   - Streams logs and reports results

Both scripts use Kubernetes Jobs in the cluster - no local Docker required.

## Examples

```bash
# Setup development environment
export NAMESPACE="dev-env" 
export INSTANCE_ID="my-zenko"
./setup-tests.sh ~/.kube/dev-config

# Run CTST tests
./run-tests.sh ~/.kube/dev-config ctst

# Run with custom metadata deployment
export GIT_ACCESS_TOKEN="ghp_xxx"
export METADATA_NAMESPACE="s3c"
./setup-tests.sh ~/.kube/prod-config

# Skip TLS setup
./setup-tests.sh ~/.kube/config --no-tls

# Setup for remote cluster with custom timeout
export JOB_TIMEOUT="3600"  # 1 hour
./setup-tests.sh ~/.kube/remote-cluster-config
./run-tests.sh ~/.kube/remote-cluster-config e2e
```

## Troubleshooting

### Job Failed or Timed Out
The scripts now automatically show detailed logs and status when jobs fail, including:
- Job status and description
- Pod status and details  
- Complete job logs

```bash
# Check job status manually if needed
kubectl get jobs -n ${NAMESPACE} -l app=zenko-setup

# Get job logs manually if needed
kubectl logs job/zenko-setup-123456 -n ${NAMESPACE}

# Delete failed jobs
kubectl delete jobs -n ${NAMESPACE} -l app=zenko-setup
```

### RBAC Issues
```bash
# Verify service account exists
kubectl get serviceaccount zenko-setup -n ${NAMESPACE}

# Check cluster role binding
kubectl get clusterrolebinding zenko-setup
```

### Remote Cluster Setup
For remote clusters, ensure:
- Your kubeconfig has proper credentials
- Network connectivity to the cluster
- Sufficient RBAC permissions in the target namespace

The scripts will automatically create the needed ServiceAccount and ClusterRoleBinding.