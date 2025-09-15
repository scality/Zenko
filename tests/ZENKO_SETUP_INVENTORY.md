# Zenko Test Setup Inventory

Complete inventory of ALL non-standard Zenko setup tasks across the entire codebase.

## Setup Tasks Inventory

| Task | Current Implementation | Used By | What It Does |
|------|----------------------|---------|--------------|
| **Mock Services - AWS** | `.github/scripts/end2end/install-mocks.sh` + `tests/ctst/steps/setup/setup.ts` | CTST, Node Tests, Backbeat Tests | Creates AWS S3 mock (CloudServer) with pre-configured metadata |
| **Mock Services - Azure** | `.github/scripts/end2end/install-mocks.sh` + `tests/ctst/steps/setup/setup.ts` | CTST, Azure Archive Tests | Creates Azurite mock for blob/queue storage |
| **Buckets - AWS** | `tests/zenko_tests/create_buckets.py` | Node Tests, Backbeat Tests | Creates `ci-zenko-aws-*-bucket` buckets with versioning |
| **Buckets - Azure** | `tests/zenko_tests/create_buckets.py` | Node Tests, Azure Tests | Creates Azure containers and queues |
| **Buckets - Ring** | `tests/zenko_tests/create_buckets.py` | Ring/S3C Tests | Creates Ring buckets with pre-populated objects |
| **Storage Locations** | `tests/zenko_tests/configuration.py` + `tests/ctst/steps/setup/setup.ts` | All Tests | Creates AWS/Azure/DMF/Ring storage locations via Management API |
| **Accounts** | `tests/zenko_tests/configuration.py` | Node Tests, UI Tests | Creates test accounts via Management API |
| **Endpoints** | `tests/zenko_tests/configuration.py` | Node Tests | Creates S3 endpoints via Management API |
| **Workflows - Replication** | `tests/zenko_tests/configuration.py` | Replication Tests | Creates replication workflows via Management API |
| **Workflows - Lifecycle** | `tests/zenko_tests/configuration.py` | Lifecycle Tests | Creates lifecycle workflows via Management API |
| **Workflows - Ingestion** | `tests/zenko_tests/configuration.py` | Ingestion Tests | Creates ingestion workflows via Management API |
| **Keycloak Realm** | `.github/scripts/end2end/keycloak-helper.sh` | Auth Tests, UI Tests | Creates realm with roles: StorageManager, AccountTest::*, etc. |
| **Keycloak Users** | `.github/scripts/end2end/keycloak-helper.sh` | Auth Tests, UI Tests | Creates users with instance IDs and role assignments |
| **DNS - CoreDNS** | `.github/scripts/end2end/patch-coredns.sh` | All Tests | Adds rewrite rules for `*.aws-mock.zenko.local` → ingress |
| **DNS - /etc/hosts** | `.github/scripts/end2end/setup-ctst-local.sh` | Local Development | Adds `127.0.0.1 iam.zenko.local ui.zenko.local s3.zenko.local...` |
| **RBAC - Cluster Admin** | `.github/scripts/end2end/setup-ctst-local.sh` + `tests/ctst/steps/setup/setup.ts` | CTST, Node Tests | Grants cluster-admin to all service accounts |
| **Kafka Topics** | `tests/ctst/steps/setup/setup.ts` | CTST, Notification Tests | Creates notification and cold storage status topics |
| **Notification Targets** | `tests/ctst/steps/setup/setup.ts` | CTST, Notification Tests | Creates ZenkoNotificationTarget CRDs for Kafka |
| **Deployment Patches** | `tests/ctst/steps/setup/setup.ts` | CTST, Quota Tests | Sets `SCUBA_HEALTHCHECK_FREQUENCY=100` on cloudserver |
| **TLS Certificates** | `.github/scripts/end2end/enable-https.sh` | HTTPS Tests | Creates CA certificates and TLS secrets |
| **Metadata Service** | `.github/scripts/end2end/deploy-metadata.sh` | S3C/Ring Tests | Deploys separate metadata service (bucketd/repd) |
| **PRA Setup** | `.github/scripts/end2end/prepare-pra.sh` | PRA/DR Tests | Configures Point-in-time Recovery and Archive |
| **Shell UI** | `.github/scripts/end2end/deploy-shell-ui.sh` | UI Tests | Deploys shell-ui for navigation |
| **Admin Credentials** | `tests/ctst/steps/setup/setup.ts` | CTST | Extracts admin access/secret keys from secrets |
| **Service User Credentials** | `tests/ctst/steps/setup/setup.ts` | CTST | Extracts backbeat service user credentials |
| **PRA Credentials** | `tests/ctst/steps/setup/setup.ts` | CTST | Extracts DR/PRA admin credentials |
| **Kafka Configuration** | `tests/ctst/steps/setup/setup.ts` | CTST | Extracts Kafka hosts and topics from secrets |
| **Instance Information** | `tests/ctst/steps/setup/setup.ts` | CTST | Extracts InstanceID, time progression factor from Zenko CR |

## Setup Script Locations

### Shell Scripts (19 files)
```
.github/scripts/end2end/
├── install-mocks.sh                    # Mock services
├── keycloak-helper.sh                  # Keycloak realm/users
├── patch-coredns.sh                    # DNS configuration  
├── setup-ctst-local.sh                 # Local dev setup
├── enable-https.sh                     # TLS certificates
├── deploy-metadata.sh                  # Metadata service
├── prepare-pra.sh                      # PRA configuration
├── deploy-shell-ui.sh                  # Shell UI  
├── run-e2e-test.sh                     # Test runner (with setup)
├── run-e2e-ctst.sh                     # CTST runner (DEPRECATED - replaced by tests/@setup/run-tests.sh)
├── deploy-zenko.sh                     # Zenko deployment
├── deploy-zkop.sh                      # Zenko operator
├── bootstrap-kind.sh                   # Kind cluster setup
├── install-kind-dependencies.sh        # Kind dependencies
├── common.sh                           # Shared utilities
├── requirements.sh                     # Prerequisite checks
└── create-pull-image-secret.sh         # Image pull secrets
```

**Note:** The following files have been removed/migrated to tests/@setup/:
- configure-e2e.sh and configure-hosts.sh (migrated to TypeScript setup)

### Python Scripts
```
tests/zenko_tests/
├── cleans3c.py                         # S3C cleanup utility
└── docker-entrypoint.sh                # Test container entrypoint

Note: configuration.py and create_buckets.py have been migrated to TypeScript in tests/@setup/src/
```

### TypeScript/CTST Setup
```
tests/ctst/steps/setup/setup.ts         # CTST-specific setup (overlaps with shell scripts)
```

## Analysis

**Total Setup Implementations:** 22+ files
**Duplicated Logic:** Mock services, RBAC, storage locations, credentials extraction
**Languages:** Bash (19 files), Python (2 files), TypeScript (1 file)
**Scope:** Some global (RBAC, DNS), some test-suite specific (credentials, buckets)

**Key Insight:** Setup is scattered across 3 different languages and 22+ files, with significant duplication between CTST (TypeScript) and shell scripts (Bash) for the same functionality.

---

# Centralization Strategy

## Solution

Create single TypeScript setup container that replaces all 22+ setup scripts.

```
tests/@setup/
├── src/
│   ├── mocks.ts       # AWS/Azure mock deployment
│   ├── buckets.ts     # Bucket creation (all providers)
│   ├── locations.ts   # Storage locations via Management API  
│   ├── keycloak.ts    # Realm/users/roles
│   ├── dns.ts         # CoreDNS configuration
│   ├── rbac.ts        # Service account permissions
│   └── cli.ts         # CLI interface
├── package.json       # Dependencies
└── Dockerfile         # Self-contained image
```

## Usage

Single command replaces all setup scripts:

```bash
docker run --rm -v ~/.kube:/root/.kube \
  -e NAMESPACE=default \
  -e SUBDOMAIN=zenko.local \
  -e INSTANCE_ID=xyz123 \
  ghcr.io/scality/zenko-test-setup:latest \
  --mocks --buckets --locations --keycloak
```

## Why Container Approach

**Problem:** Setup logic scattered across 22+ files in 3 languages (Bash, Python, TypeScript) with no shared dependencies or runtime.

**Container Solution:**
- Packages all setup logic in single consistent environment
- Provides TypeScript runtime with all dependencies (@kubernetes/client-node, @aws-sdk/*, @azure/*)
- Eliminates language/dependency conflicts between test suites
- Can be called identically from any test suite or CI/CD pipeline
- Kubernetes API access via mounted kubeconfig

**Alternative approaches failed:**
- Shell scripts: Limited, hard to maintain, no type safety
- Python integration: Would require Python runtime in TypeScript test suites  
- Direct TypeScript import: Would force all test suites to adopt TypeScript dependencies

## Integration

**CTST:** Call container in BeforeAll, keep only info retrieval functions
**Node tests:** Replace create_buckets.py + configuration.py with container call
**GitHub workflows:** Replace install-mocks.sh + keycloak-helper.sh + other scripts with container call
