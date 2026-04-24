# Zenko

**Scality's open-source multi-cloud data controller** — a Kubernetes-based deployment of the Zenko stack. The actual service implementations (cloudserver, backbeat, vault2, sorbet, scuba, s3utils, pensieve-api, kafka-cleaner, drctl, zenko-operator) live in separate repos; this repo packages, versions, integration-tests, and releases them together.

## What lives here

- `solution/deps.yaml`, `solution-base/deps.yaml` — image/registry/tag manifests for every Zenko component
- `solution/zenkoversion.yaml` — `ZenkoVersion` CR template (dashboards, policies, feature flags, capabilities, location types)
- `solution/kafka/Dockerfile`, `solution/kafka-connect/Dockerfile` — Scality-built Kafka + Kafka Connect images
- `solution-base/mongodb/` — MongoDB Helm charts and patches
- `tests/functional/ctst/` — TypeScript Cucumber end-to-end tests
- `tests/workflows/` — TypeScript Jest tests for CI tooling
- `tests/zenko_tests/` — Python + Node.js integration tests
- `monitoring/` — Prometheus rules, Grafana dashboards
- `.github/workflows/` — CI pipelines (`end2end`, `release`, `review`, `alerts`)

## Toolchains

Multiple runtimes in play — check the specific subproject's Dockerfile / workflow for the authoritative version:

- Node.js — ctst uses node 24 (set via `actions/setup-node` in `.github/workflows/end2end.yaml`); `end2end.yaml` jobs use node 22, and 24 for different tasks
- Python — `tests/zenko_tests/` targets Python 3
- Kafka images — alpine + `eclipse-temurin` JRE 17 (`solution/kafka/Dockerfile`)

## PR review

Review criteria for this repo live in [.github/copilot-instructions.md](.github/copilot-instructions.md). The CI review workflow ([.github/workflows/review.yaml](.github/workflows/review.yaml)) loads them automatically via the `scality/agent-hub` plugin marketplace.
