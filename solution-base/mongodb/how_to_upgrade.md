# MongoDB Sharded Upgrade Process

## Overview

Upgrading MongoDB sharded involves several steps to ensure a smooth transition to the new version. Below is a structured guide to follow for a successful upgrade (note that all along
I'll be taking as an example the upgrade from 5 to 6) :

## Upgrade steps


1. Check for all available versions of the chart using `helm search repo bitnami/mongodb-sharded --versions` to check the configuration values for a specified version : `helm show values --version 6.6.7  bitnami/mongodb-sharded`
2. Bump mongo version in Kustomization.yaml and deps.yaml files 
3. Upgrade mongodb sharded version in charts => `CHART_MONGO_SHARDED_VERSION` in the solution-base/mongodb/Makefile (e.g CHART_MONGO_SHARDED_VERSION:="6.6.7")
4. Upgrade charts to the version targetted => `make fetch-mongodb-sharded`
5. Manually update the patches by applying the changes manually in the new upgraded charts (note that this can be applied only to patches that target mongo sharded) =>  `git diff -- solution-base/mongodb/charts/mongodb-sharded/values.yaml > solution-base/mongodb/patches/secret-name.patch` (this operation needs to be done for every patch).
6. Once the patches updated apply them to the charts with the command `make patch`
7. Applying the changes introduced by the upgrade can then be done (by checking the release notes for the new version e.g `https://www.mongodb.com/docs/v6.0/release-notes/6.0/`)
8. The CI has to pass for the update to be considered effective.