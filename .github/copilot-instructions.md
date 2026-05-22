# Zenko — Copilot / AI Reviewer Instructions

## Repo context

This is **Scality's open-source multi-cloud data controller** — a Kubernetes-based deployment of the Zenko stack. The actual service implementations (cloudserver, backbeat, vault2, sorbet, scuba, s3utils, pensieve-api, kafka-cleaner, drctl, zenko-operator) live in separate repos; this repo packages, versions, and tests them together.

Key paths:

- `solution/deps.yaml`, `solution-base/deps.yaml` — image/registry/tag manifests for every Zenko component
- `solution/zenkoversion.yaml` — `ZenkoVersion` CR template (dashboards, policies, feature flags, capabilities, location types)
- `solution/kafka/Dockerfile`, `solution/kafka-connect/Dockerfile` — Scality Kafka + Kafka Connect images
- `solution-base/mongodb/` — MongoDB Helm charts and patches
- `tests/functional/ctst/` — TypeScript Cucumber end-to-end tests
- `tests/workflows/` — TypeScript Jest tests for CI tooling
- `tests/zenko_tests/` — Python + Node.js integration tests
- `monitoring/` — Prometheus rules, Grafana dashboards
- `.github/workflows/` — CI pipelines (`end2end`, `release`, `review`, `alerts`)

## PR review criteria

When reviewing a PR, analyze changes against the following. Post inline comments only for real problems — no praise, no style nits covered by linters.

| Area | What to check |
|------|---------------|
| **Image tag pinning** (`solution/deps.yaml`, `solution-base/deps.yaml`) | Every entry must pin to a concrete released tag or content hash — never a branch, `latest`, or a floating ref. Scality-internal images (cloudserver, backbeat, vault2, ...) must resolve to a tag actually published on `ghcr.io/scality`. |
| **Version coherence** | Bumps to `VERSION` / `deps.yaml` / `solution/zenkoversion.yaml` should stay mutually consistent. Feature flags or capabilities added in `zenkoversion.yaml` must correspond to service versions that actually support them. |
| **Dockerfiles** (`solution/kafka/`, `solution/kafka-connect/`...) | Base images pinned by tag or digest, no secrets baked in, no unnecessary `COPY . .`, reasonable layer count, user is non-root where possible. |
| **Helm charts & K8s manifests** (`solution-base/mongodb/charts/`, `monitoring/`) | Resource requests/limits set, label selectors match, no hard-coded namespaces, `securityContext` present, ServiceAccount scoping minimal. Any breaking chart-value renames documented in an upgrade note. |
| **Chart upgrade path** (`solution-base/mongodb/Makefile`, `how_to_upgrade.md`) | If chart version or MongoDB version changes, upgrade notes are updated and the `git subtree merge --squash` produced by `make vendor-sync` resolves cleanly against our local commits. |
| **TypeScript tests** (`tests/functional/ctst/`, `tests/workflows/`) | Proper `async`/`await`, no swallowed promise rejections, Cucumber step definitions register correctly, no accidental `.only` / `.skip`, correct use of World context in ctst. |
| **Python tests** (`tests/zenko_tests/`) | No bare `except:`, specific exception types, consistency with existing style, `requirements.txt` kept in sync. |
| **CI workflows** (`.github/workflows/`) | Actions pinned (tag or SHA), secrets not echoed to logs, `permissions:` block scoped minimally, reusable-workflow inputs/secrets wired correctly, runner labels valid for Scality infra. |
| **Monitoring changes** (`monitoring/`) | PromQL expressions valid, alert labels/annotations follow existing conventions, dashboard panels reference real metrics, Grafana JSON not corrupted by export tooling. |
| **Secrets & config leaks** | No credentials, tokens, cloud keys, or internal hostnames in YAML templates, Dockerfiles, `.env*` files, or test fixtures. |
| **Breaking changes** | Renamed env vars, removed `zenkoversion.yaml` capabilities/feature flags, removed location types, or changed `ZenkoVersion` CR shape must be called out — they break deployed operators. |
| **Security** | OWASP-relevant issues for web/API code in tests; overly permissive RBAC, hostPath/hostNetwork usage, privileged containers in manifests. |

## What NOT to flag

- Markdown formatting preferences
- Refactors unrelated to the PR's purpose
- Style issues already covered by the project's linter (eslint, biome, pylint)
- Anything you can't tie to a concrete problem — if in doubt, stay silent
