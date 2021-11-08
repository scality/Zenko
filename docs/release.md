# Zenko Release Instructions

## Release Process

To release the Zenko and Zenko-base ISOs:

1. Tag and release the Zenko version using the [GitHub release page](https://github.com/scality/Zenko/releases/new).
1. Retrieve the eve `artifacts_name` of the tagged build. This can be found
   under the `Build Properties` of the selected eve build.
1. Tag the selected artifacts using the eve `promote` command:
   * The `promote` command can be found on the [eve builders page](https://eve.devsca.com/github/scality/zenko/#/builders/4).
   * Fill the `artifact source` field with the retrieved `artifacts_name`.
   * Fill the `tag` field with the Zenko tag.
