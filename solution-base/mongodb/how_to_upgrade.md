# MongoDB Sharded Upgrade Process

## Overview

Upgrading MongoDB sharded involves several steps to ensure a smooth transition to the new version. Below is a structured guide to follow for a successful upgrade (note that all along
I will be taking as an example the upgrade from 5 to 6):

## Upgrade steps


1. Check for all available versions of the chart using `helm search repo bitnami/mongodb-sharded --versions` to check the configuration values for a specified version: `helm show values --version 6.6.7  bitnami/mongodb-sharded`
2. Bump mongo version in `solution-base/deps.yaml` files.
3. Bump mongodb sharded version in charts => `CHART_MONGO_SHARDED_VERSION` in the `solution-base/mongodb/Makefile` file (e.g. `CHART_MONGO_SHARDED_VERSION:="6.6.7"`)
4. Upgrade charts to the version targetted => `make fetch-mongodb-sharded`
5. Manually update the patches by applying the changes manually in the new upgraded charts => `git diff -- solution-base/mongodb/charts/mongodb-sharded/values.yaml > solution-base/mongodb/patches/secret-name.patch` (this operation needs to be done for every patch).
**Note**: This step is only necessary if the patch does not apply automatically.
6. Once the patches are updated, apply them to the charts with the command `make patch`.
7. After upgrading, you may need to apply additional changes that are not directly handled by the charts or patches. For example, when upgrading to MongoDB 6.0, you need to switch from using `mongo` to `mongosh`. Refer to the release notes for the new version (e.g., `https://www.mongodb.com/docs/v6.0/release-notes/6.0/`) for details on these additional changes.
8. Passing CI tests is not enough, you must also perform an upgrade check with the product(s) using this Zenko version, before merging the upgrade PR. Some changes may be required at upper-levels (e.g., update mongosh commands, or add new logic in the upgrade).
