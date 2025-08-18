# MongoDB Sharded Upgrade Process

## Overview

Upgrading MongoDB sharded involves several steps to ensure a smooth transition
to the new version. Below is a structured guide to follow for a successful
upgrade (note that all along we will be taking as an example the upgrade from
MongoDB 8.0.10 to 9.3.6):

## Upgrade steps

1. Update your local view of the helm charts: `helm repo update bitnami`.
You may also reinstall it with
`helm repo remove bitnami && helm repo add bitnami https://charts.bitnami.com/bitnami`.

2. Check for all available versions of the chart using
`helm search repo bitnami/mongodb-sharded --versions` to check the
configuration values for a specified version:
`helm show values --version 9.3.6 bitnami/mongodb-sharded`.

3. Bump mongo version in `solution-base/deps.yaml` files. The current version
can be found in
`https://github.com/bitnami/charts/blob/main/bitnami/mongodb-sharded/Chart.yaml`.

4. Bump mongodb-sharded chart version : `CHART_MONGO_SHARDED_VERSION` in the
`solution-base/mongodb/Makefile` file (e.g. `CHART_MONGO_SHARDED_VERSION:="9.3.6"`).
This version can be found from the output of the above `helm search` command.

5. Upgrade charts to the version targetted: `make fetch-mongodb-sharded`, from
the `solution-base/mongodb` directory.

6. Manually update the patches by applying the changes manually in the new
upgraded charts:
`git diff -- solution-base/mongodb/charts/mongodb-sharded/values.yaml > solution-base/mongodb/patches/secret-name.patch`
(this operation needs to be done for every patch).
**Note**: This step is only necessary if the patch does not apply
automatically. Do it from the root of the repository.

7. Once the patches are updated, apply them to the charts with the command
`make patch`.

8. After upgrading, you may need to apply additional changes that are not
directly handled by the charts or patches. Please carefully review the new
logic added by the new chart version, and ensure they remain compatible with
our use case.

9. Passing CI tests is not enough, you must also perform an upgrade check with
the product(s) using this Zenko version, before merging the upgrade PR. Some
changes may be required at upper-levels (e.g., update mongosh commands, or add
new logic in the upgrade).
