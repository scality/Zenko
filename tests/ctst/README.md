# CTST tests for Zenko

Set of feature tests for Zenko. CTST is a CucumberJS-powered test runner with
AWS-CLI support. It allows to write API-based feature tests and run them against
a running Zenko. CTST uses external test files and *worlds* and is modular
enough to let you use any additional library (e.g., Prometheus SDK to perform
Prometheus queries).

## Use CTST

Running CTST on a local Zenko can be done by running the script `tests/ctst/run.sh`

The script runs the end to end tests in a pod withing the kubernetes cluster,
this was done to give the tests access to internal resources such as the Kafka cluster.

The `kubectl run` command uses a custom image of CTST containing the required test
folders. The image can be built and pushed with the following steps:

``` bash
cd ./tests/ctst/

# Building the image
docker build --build-arg CTST_TAG=0.2.0 . -t registry.scality.com/playground/<username>/custom-ctst:0.2.0

# Pushing the custom image into a repository
docker push registry.scality.com/playground/<username>/custom-ctst:0.2.0
```

Running the tests can be done with the following steps:

```bash
cd ./tests/ctst/

ZENKO_ACCOUNT_NAME=<ZENKO_ACCOUNT_NAME> \
ZENKO_ACCESS_KEY=<ZENKO_ACCESS_KEY> \
ZENKO_SECRET_KEY=<ZENKO_SECRET_KEY> \
ZENKO_PORT=<ZENKO_PORT> \
SUBDOMAIN=<SUBDOMAIN> \
E2E_IMAGE=<E2E_IMAGE> \
./run.sh <mode> <parallel_workers>
```

Where `ZENKO_ACCOUNT_NAME`, `ZENKO_ACCESS_KEY` and `ZENKO_SECRET_KEY` are the account credentials.

`SUBDOMAIN` and `ZENKO_PORT` are the subdomain and port used to reach Zenko.

And `E2E_IMAGE` is the custom CTST image that we built in the previous step.

`mode` is how we want to run CTST, the value can be one of :

- `dry-run`: invoke formatters without executing steps,
this can be used to check if CTST is working properly
- `premerge`: runs all tests tagged with @PreMerge
- `all`: runs all tests

`parallel_workers` sets the number of tests to run in parallel

> **Note:**
>
> Some tests may require some additional configuration before running the tests.
>
> Please refer to `.github/scripts/end2end/configure-e2e-ctst.sh` to see the configuration applied
in the CI for CTST tests.
