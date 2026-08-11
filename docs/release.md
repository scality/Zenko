# Zenko Release Instructions

## Release Process

To release the Zenko and Zenko-base ISOs:

1. Start the [Github Actions release workflow](https://github.com/scality/Zenko/actions/workflows/release.yaml).
   * Select the branch to release from (`development/X.Y` for a regular/preview/rc release, `hotfix/X.Y.Z` for a hotfix).
   * Pick the release `type`:
     * `release` — next patch release (e.g. `2.14.3`, or hotfix `2.13.5-1`)
     * `preview` — next preview (e.g. `2.14.3-preview.1`)
     * `rc` — next release candidate (e.g. `2.14.3-rc.1`)

The version is computed automatically from the current branch and existing tags (no `VERSION` file to bump, no commit needed). The workflow:

1. Computes the next version via `version.sh --<type>`.
2. Builds the ISOs with that version (via the reusable `build-iso.yaml` workflow) and uploads them to staging.
3. Creates the git tag and GitHub release.
4. Promotes the staged artifacts to the released path.
