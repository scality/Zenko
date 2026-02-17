# CTST Tests for Zenko

Cucumber-based end-to-end tests for Zenko. Tests run inside a Kubernetes pod to access internal resources (Kafka, Vault, etc.).

Note : Multiple Cucumber vscode extensions are available to help with development.

## Quick Start (Github Codespaces)

> **Prerequisites:** This assumes you're running in a GitHub Codespace with the devcontainer fully set up. See [.devcontainer/README.md](../../.devcontainer/README.md) for setup details.

Run tests with a tag:

```bash
cd tests/ctst
./run-ctst-locally.sh @getObject
./run-ctst-locally.sh "@PreMerge and not @Flaky"  # Use quotes for complex expressions
```

This uses the pre-built image `ghcr.io/scality/zenko/zenko-e2e-ctst:ctst_codespace_setup` which is built and loaded into kind when Codespace setup.sh runs.

### Rebuilding the CTST Image

If you need to test changes to the Dockerfile or dependencies:

```bash
# 1. Build the CTST image

SORBET_TAG=$(yq eval '.sorbet.tag' ../../solution/deps.yaml)
DRCTL_TAG=$(yq eval '.drctl.tag' ../../solution/deps.yaml)
GIT_AUTH_TOKEN=$GITHUB_TOKEN docker build \
  --secret id=GIT_AUTH_TOKEN \
  --build-arg SORBET_TAG=$SORBET_TAG \
  --build-arg DRCTL_TAG=$DRCTL_TAG \
  -t ctst-local:dev \
  .

# 2. Load into kind (and reset the pod if it already exists with a different image)
kind load docker-image ctst-local:dev
kubectl delete pod ctst-end2end

# 3. Run tests with custom image
./run-ctst-locally.sh @getObject ctst-local:dev
./run-ctst-locally.sh "@PreMerge or @CRR" ctst-local:dev  # Complex expressions need quotes
```

### Resetting the Test Pod

The test pod persists between runs for faster iteration. If you need to reset it (e.g., after changing the image):

```bash
kubectl delete pod ctst-end2end
```

## How It Works

1. **Image is loaded into kind** - The Docker image is loaded into the kind cluster
2. **Pod runs with `sleep infinity`** - A long-running pod is created for fast test iteration
3. **Test files are copied** - Local `features/`, `steps/`, `common/`, `world/` are copied into the pod
4. **Tests run via `yarn cucumber-js`** - Standard Cucumber syntax with tag filtering

## Tag Syntax

Use any valid Cucumber tag expression. Use quotes for expressions with spaces:

```bash
./run-ctst-locally.sh @getObject
./run-ctst-locally.sh @PreMerge
./run-ctst-locally.sh "@PreMerge and not @Flaky"
./run-ctst-locally.sh "@CRR or @Lifecycle"
```

## Configuration

The script uses hardcoded world parameters suitable for local Codespace testing. For CI configuration, see `.github/scripts/end2end/run-e2e-ctst.sh`.

> **Important note:** Some tests require additional configuration. See `.github/scripts/end2end/configure-e2e-ctst.sh` for CI setup.
