# Zenko Test Setup CLI

Unified CLI tool for Zenko test environment setup, consolidating all scattered setup scripts into a single TypeScript-based containerized solution.

## Overview

This tool replaces 22+ setup scripts scattered across Bash, Python, and TypeScript by providing a single, consistent interface for setting up Zenko test environments.

## Features

- **Mock Services**: AWS S3 (CloudServer) and Azure (Azurite) mock deployments
- **Test Buckets**: Automated creation across AWS, Azure, and Ring providers
- **Storage Locations**: Management API configuration for all storage backends
- **Keycloak Setup**: Realm, users, and role configuration
- **DNS Configuration**: CoreDNS rewrite rules for test domains
- **RBAC Permissions**: Service account cluster-admin permissions

## Installation

### Container Usage (Recommended)

```bash
docker run --rm -v ~/.kube:/root/.kube \
  -e NAMESPACE=default \
  -e SUBDOMAIN=zenko.local \
  -e INSTANCE_ID=xyz123 \
  ghcr.io/scality/zenko-test-setup:latest \
  all --verbose
```

### Local Development

```bash
# Clone and install
yarn install

# Build
yarn build

# Run locally
yarn dev -- all --namespace=default --subdomain=zenko.local
```

## Usage

### Complete Setup

Run all setup tasks:
```bash
zenko-setup all --namespace=my-namespace --subdomain=test.local
```

Skip specific components:
```bash
zenko-setup all --skip-mocks --skip-keycloak
```

### Individual Components

Setup specific components:
```bash
# Mock services only
zenko-setup mocks --aws-only

# Buckets for specific provider
zenko-setup buckets --provider=aws

# Storage locations
zenko-setup locations

# Keycloak realm and users
zenko-setup keycloak

# DNS configuration
zenko-setup dns

# RBAC permissions
zenko-setup rbac
```

### Options

Global options available for all commands:

- `--namespace <namespace>`: Kubernetes namespace (default: default)
- `--subdomain <subdomain>`: DNS subdomain (default: zenko.local)
- `--instance-id <id>`: Zenko instance ID for role assignments
- `--kubeconfig <path>`: Path to kubeconfig file
- `--dry-run`: Show what would be done without executing
- `--verbose`: Enable verbose logging

## Environment Variables

Configure via environment variables:

```bash
export NAMESPACE=my-namespace
export SUBDOMAIN=test.local
export INSTANCE_ID=abc123
export KUBECONFIG=/path/to/kubeconfig
export LOG_LEVEL=debug
```

## Container Environment

The container requires:

1. **Kubernetes Access**: Mount kubeconfig or use in-cluster config
2. **Network Access**: Ability to reach Kubernetes API and services

Example with kubeconfig mount:
```bash
docker run --rm \
  -v ~/.kube:/root/.kube:ro \
  -e NAMESPACE=zenko-test \
  -e SUBDOMAIN=test.local \
  ghcr.io/scality/zenko-test-setup:latest \
  all
```

Example with in-cluster config (when running in Kubernetes):
```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: setup
    image: ghcr.io/scality/zenko-test-setup:latest
    args: ["all", "--namespace=zenko-test"]
    env:
    - name: NAMESPACE
      value: "zenko-test"
  serviceAccountName: zenko-setup # with cluster-admin permissions
```

## Integration Examples

### CTST Integration

Replace existing setup logic:
```typescript
// Before: Complex setup in BeforeAll
beforeAll(async () => {
  // Call container instead of individual scripts
  await exec('docker run --rm -v ~/.kube:/root/.kube ghcr.io/scality/zenko-test-setup:latest all');
  
  // Keep only info extraction
  await extractInstanceInfo();
  await extractCredentials();
});
```

### GitHub Workflows

Replace multiple script calls:
```yaml
# Before: Multiple script executions
- name: Setup Mocks
  run: .github/scripts/end2end/install-mocks.sh
- name: Setup Keycloak  
  run: .github/scripts/end2end/keycloak-helper.sh

# After: Single container call
- name: Setup Test Environment
  run: |
    docker run --rm \
      -v ${{ env.KUBECONFIG }}:/root/.kube/config \
      -e NAMESPACE=${{ env.NAMESPACE }} \
      ghcr.io/scality/zenko-test-setup:latest \
      all --verbose
```

### Node.js Test Integration

```bash
# Replace Python scripts
# Before: python tests/zenko_tests/create_buckets.py
# After: 
docker run --rm -v ~/.kube:/root/.kube ghcr.io/scality/zenko-test-setup:latest buckets
```

## Development

### Project Structure

```
src/
├── cli.ts         # Main CLI interface
├── mocks.ts       # AWS/Azure mock deployment
├── buckets.ts     # Bucket creation (all providers)
├── locations.ts   # Storage locations via Management API
├── keycloak.ts    # Realm/users/roles
├── dns.ts         # CoreDNS configuration
├── rbac.ts        # Service account permissions
└── utils/
    ├── logger.ts  # Logging utilities
    └── k8s.ts     # Kubernetes client wrapper
```

### Building

```bash
# Install dependencies
yarn install

# Build TypeScript
yarn build

# Run tests
yarn test

# Lint code
yarn lint
```

### Container Build

```bash
# Build container image
docker build -t zenko-test-setup:latest .

# Test container
docker run --rm zenko-test-setup:latest --help
```

## Troubleshooting

### Common Issues

1. **Kubeconfig not found**: Ensure kubeconfig is mounted at `/root/.kube/config`
2. **Permission denied**: Service account needs cluster-admin permissions
3. **DNS changes not applied**: CoreDNS pods may need manual restart
4. **Management API unavailable**: Check Zenko deployment status

### Debug Mode

Enable verbose logging:
```bash
zenko-setup all --verbose
```

Check container logs:
```bash
docker logs <container-id>
```

### Dry Run

Test what would be executed:
```bash
zenko-setup all --dry-run --verbose
```

## Contributing

1. Follow TypeScript best practices
2. Add tests for new functionality  
3. Update documentation
4. Ensure container builds successfully

## License

Apache License 2.0