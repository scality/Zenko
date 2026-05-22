# MongoDB Sharded Upgrade Process

## Overview

The `mongodb-sharded` Helm chart is vendored from the `bitnami/charts`
GitHub repository via `git subtree`. Bitnami stopped publishing
`mongodb-sharded` OCI chart artifacts in August 2025 (see
[bitnami/charts#35164](https://github.com/bitnami/charts/issues/35164));
the chart source on GitHub is still updated and tagged for every
release, and is now the authoritative source for new versions.

Our local modifications live as **ordinary git commits on top of the
subtree merge**, not as separate `.patch` files. Future upgrades merge
the new upstream via `git subtree merge --squash`, which produces real
three-way merge conflicts where upstream has touched lines our local
commits modified.

## Upgrade steps

1. Browse available versions at <https://github.com/bitnami/charts/tags>
   (filter for `mongodb-sharded/*`). To inspect values or templates for
   a specific version, view the source at
   `https://github.com/bitnami/charts/tree/mongodb-sharded%2F<VERSION>/bitnami/mongodb-sharded`
   (the `%2F` is the URL-encoded `/` in the tag name).

2. Bump image tags in `solution-base/deps.yaml` if needed. The image
   tags shipped with the chart can be found under `annotations.images`
   in the upstream `Chart.yaml` at the same tag.

3. Bump `CHART_VERSION` in `solution-base/mongodb/Makefile` to the
   target version.

4. Run `make -C solution-base/mongodb vendor-sync`. This:
   - Ensures the `bitnami-charts` remote is configured.
   - Fetches upstream `main` and the new chart tag.
   - Runs `git subtree split` to synthesize the chart's history (slow:
     ~4 minutes on a warm clone, longer on a fresh fetch).
   - Runs `git subtree merge --squash` to merge upstream into our
     prefix.
   - Re-resolves the `common` library dependency via
     `helm dependency build`, then extracts the resulting tarball into
     a directory under `charts/common/` so `solution-base/build.sh`'s
     `helm template` finds it as a sub-chart.

5. Resolve any merge conflicts that arise where upstream touched lines
   our local commits modified. If new local tweaks are needed
   (entrypoint changes, security-context adjustments, …), make them as
   **explicit follow-up commits**, not by amending the subtree merge.
   History should look like:

   ```
   Merge upstream mongodb-sharded/X.Y.Z
   mongodb: <local tweak 1>
   mongodb: <local tweak 2>
   Merge upstream mongodb-sharded/X.Y.Z+1
   mongodb: <new tweak after upgrade>
   ```

6. Sanity-check by running `solution-base/build.sh` (which calls
   `helm template`) and reviewing the merge commit's diff for
   unexpected upstream changes.

7. Passing CI tests is not enough — perform an upgrade check against
   the product(s) using this Zenko version (e.g. Artesca) before
   merging the upgrade PR. Some upper-level changes may be required
   (mongosh commands, upgrade flow tweaks).
