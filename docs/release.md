# Zenko Release Instructions

## Release Process

To release the Zenko and Zenko-base ISOs:

1. Update the version in the `VERSION` file and merge the changes (e.g., `2.4.15`).
2. Start a new promotion using the [Github Actions release workflow](https://github.com/scality/Zenko/actions/workflows/release.yaml)
   * Select the branch to release.
   * Specify the tag from the step 1 (e.g., `2.4.15`).
   * Specify the artifacts to promote.
     The artifact URL can be found in the commit build you want to promote, under `Annotations`.
     For example: `https://artifacts.scality.net/builds/github:scality:Zenko:staging-d13ed9e848.build-iso-and-end2end-test.230`

The workflow will automatically create a new GitHub release.
