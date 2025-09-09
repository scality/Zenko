# Migration to CTST-Only Test Suite

This document outlines the plan to migrate all E2E tests to CTST and remove legacy test suites.

## **Current State Analysis**

### **Existing Test Suites:**
1. **Python E2E Tests** (`tests/zenko_tests/`)
   - Configuration-based tests using `configuration.py`
   - Account, location, workflow setup via Management API
   - Bucket creation and management
   
2. **Node.js Tests** (`tests/zenko_tests/node_tests/`)
   - Backbeat tests
   - CloudServer tests  
   - IAM policy tests
   - Smoke tests
   - UI tests

3. **CTST Tests** (`tests/ctst/`)
   - Feature-based Gherkin tests
   - TypeScript step definitions
   - Modern Cucumber.js framework

### **Current Workflow Steps:**
```yaml
- Configure E2E test environment (Python)
- Run Python E2E tests (end2end, iam-policies, object-api, smoke, backbeat)
- Configure E2E CTST test environment  
- Run CTST tests
```

## **Migration Strategy**

### **Phase 1: CTST Infrastructure Simplification** ✅ (COMPLETED)
- [x] Simplified CTST setup to minimal parameter extraction
- [x] Moved static values to Zenko class
- [x] Removed complex Kubernetes setup from CTST (now handled internally)
- [x] Created comprehensive ZenkoCR TypeScript types

### **Phase 2: Feature Migration** (IN PROGRESS)
Migrate existing test functionality to CTST:

#### **Already in CTST:**
- [x] Azure Archive tests (`azureArchive.feature`)
- [x] PRA tests (`pra.feature`) 
- [x] CloudServer Auth (`cloudserverAuth.feature`)
- [x] Bucket Website (`bucketWebsite.feature`)
- [x] IAM Policies (`iam-policies/`)
- [x] Quotas (`quotas/`)
- [x] Resource Policies (`resource-policies/`)
- [x] Utilization (`utilization/`)
- [x] Bucket Notifications (`bucket-notifications/`)

#### **Need Migration to CTST:**
- [ ] **Backbeat tests** → Convert to CTST features
- [ ] **Object API tests** → Convert to CTST features  
- [ ] **Smoke tests** → Convert to CTST features
- [ ] **UI tests** → Convert to CTST features
- [ ] **Configuration management** → Convert to CTST Background steps

### **Phase 3: Infrastructure Consolidation** (FUTURE)
Replace shared infrastructure with CTST-native approach:

#### **Current Shared Infrastructure:**
- `install-mocks.sh` → CTST built-in mock management
- `patch-coredns.sh` → CTST built-in DNS configuration  
- `keycloak-helper.sh` → CTST built-in Keycloak setup
- `configuration.py` → CTST Background steps

#### **CTST-Native Replacements:**
```typescript
// Replace install-mocks.sh
@Before
async function setupMockServices() {
    // CTST handles mock services internally
}

// Replace configuration.py
@Background
async function setupTestConfiguration() {
    // CTST handles accounts, locations, workflows
}
```

### **Phase 4: Workflow Simplification** (FUTURE)
Final simplified workflow:

```yaml
steps:
  - name: Deploy Zenko
    uses: ./.github/actions/deploy
  - name: Setup CTST Prerequisites  
    run: bash setup-ctst-local.sh
  - name: Run All E2E Tests via CTST
    run: bash run-e2e-ctst.sh
```

## **Local Development Support**

### **Current Approach:**
```bash
# Setup prerequisites (DNS, /etc/hosts)
.github/scripts/end2end/setup-ctst-local.sh

# Run CTST tests
cd tests/ctst
npm test
```

### **Future CTST-Only Approach:**
```bash
# CTST handles everything
cd tests/ctst  
npm test  # CTST auto-detects environment and sets up everything needed
```

## **Benefits of CTST-Only Architecture**

1. **Unified Framework**: Single test framework for all E2E testing
2. **Better Maintainability**: No duplicate test logic across frameworks
3. **Modern Tooling**: TypeScript, Gherkin, modern Cucumber.js
4. **Self-Contained**: CTST handles all infrastructure setup internally
5. **Developer Experience**: Simple `npm test` for all E2E testing

## **Migration Checklist**

- [x] Simplify CTST parameter extraction
- [x] Remove complex Kubernetes setup from CTST
- [x] Create CTST-native local development script
- [ ] Migrate remaining Python tests to CTST features
- [ ] Migrate Node.js tests to CTST steps
- [ ] Remove legacy test suites
- [ ] Simplify GitHub Actions workflow
- [ ] Update documentation

## **Timeline**

1. **Immediate**: CTST infrastructure simplified (DONE)
2. **Short-term**: Migrate critical test features to CTST  
3. **Medium-term**: Deprecate Python/Node.js test suites
4. **Long-term**: CTST becomes the only E2E test suite