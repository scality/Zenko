# CTST Tests for Zenko

Cucumber-based end-to-end tests for Zenko. Tests run directly on the host (out-of-cluster) and access
Zenko services through ingress endpoints and port-forwards.

Note : Multiple Cucumber vscode extensions are available to help with development.

## Quick Start (Github Codespaces)

> **Prerequisites:** This assumes you're running in a GitHub Codespace with the devcontainer fully set up. See [.devcontainer/README.md](../../../.devcontainer/README.md) for setup details.

Run tests with a tag:

```bash
bash .github/scripts/end2end/run-e2e-ctst.sh "@PreMerge and not @Flaky"
```

## How It Works

1. **One-time setup** - `configure-e2e-ctst.sh` deploys auth Kafka, creates topics, and adds
   notification destinations. This is run automatically by the devcontainer `setup.sh` or as
   a separate CI workflow step.
2. **Environment setup** - `run-e2e-ctst.sh` sources `setup-e2e-env.sh` which configures
   port-forwards, ingress endpoints, `/etc/hosts` entries, credentials, and environment variables.
3. **Tests run via `yarn cucumber-js`** - Standard Cucumber syntax with tag filtering, executed
   directly on the host machine.
4. **Binaries** - `sorbetctl` and `zenko-drctl` are extracted from their Docker images into
   `tests/functional/ctst/` during environment setup.

## Tag Syntax

Use any valid Cucumber tag expression. Use quotes for expressions with spaces:

```bash
bash .github/scripts/end2end/run-e2e-ctst.sh @PreMerge
bash .github/scripts/end2end/run-e2e-ctst.sh "@PreMerge and not @Flaky"
bash .github/scripts/end2end/run-e2e-ctst.sh "@CRR or @Lifecycle"
```