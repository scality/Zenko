=========
zenko_e2e
=========

A suite of end-to-end tests for Zenko.

Quickstart
----------

Set Up the Environment
++++++++++++++++++++++

To install charts and launch tests into the Kubernetes cluster,
Helm and kubectl must be configured to manage the target cluster.

To configure the test to reflect the cluster's confuiguration:

1. Change the variable ``IMAGE_REPO`` in ``.local.env`` to a Docker hub user
   name you control.

2. Copy and fill in ``.secrets.env``::

   $ cp .secrets.env.example .secrets.env && vim .secrets.env

3. Source your environment files::

   $ source .env && source .secrets.env && source .local.env

4. Run the tests::

   $ make -e test

Pre-Installed Zenko
+++++++++++++++++++

1. Install and deploy Zenko as normal.

2. Configure it using Orbit.

   You may need to make changes to ``.env`` to reflect the buckets and backends
   you have configured manually.

3. Change the ``IMAGE_REPO`` variable in ``.local.env`` to a Docker hub user
   name you control.

4. Copy and fill in ``.secrets.env``.::

   $ cp .secrets.env.example .secrets.env && vim .secrets.env

5. Source your environment files.::

   $ source .env && source .secrets.env && source .local.env

6. Run the tests.::

   $ make -e test-local``

Environment Variables
---------------------

Tests are configured using two environment files: ``.env`` for common
config and ``.secrets.env`` for sensitive info.

A ``.env`` file is provided in the tests directory filled with information
matching the CI. A skeleton ``.secrets.env`` is available as
``.secrets.env.example``.

Variables are shown with default values.

Backend Config
++++++++++++++

Backend cloud buckets are configured using::

    AWS_BUCKET_NAME=ci-zenko-aws-target-bucket
    AWS_BUCKET_NAME_2=ci-zenko-aws-target-bucket-2
    AWS_CRR_BUCKET_NAME=ci-zenko-aws-crr-target-bucket

    GCP_BUCKET_NAME=ci-zenko-gcp-target-bucket
    GCP_BUCKET_NAME_2=ci-zenko-gcp-target-bucket-2
    GCP_MPU_BUCKET_NAME=ci-zenko-gcp-mpu-bucket
    GCP_MPU_BUCKET_NAME_2=ci-zenko-gcp-mpu-bucket-2
    GCP_CRR_BUCKET_NAME=ci-zenko-gcp-crr-target-bucket
    GCP_CRR_MPU_BUCKET_NAME=ci-zenko-gcp-crr-mpu-bucket

    AZURE_BUCKET_NAME=ci-zenko-azure-target-bucket
    AZURE_BUCKET_NAME_2=ci-zenko-azure-target-bucket-2
    AZURE_CRR_BUCKET_NAME=ci-zenko-azure-crr-target-bucket

Source buckets for CRR are configured using::

    AWS_CRR_SRC_BUCKET_NAME=ci-zenko-aws-crr-src-bucket
    GCP_CRR_SRC_BUCKET_NAME=ci-zenko-gcp-crr-src-bucket
    AZURE_CRR_SRC_BUCKET_NAME=ci-zenko-azure-crr-src-bucket
    MULTI_CRR_SRC_BUCKET_NAME=ci-zenko-multi-crr-src-bucket
    TRANSIENT_SRC_BUCKET_NAME=ci-transient-src-bucket

Backbeat test locations are configured using::

    AWS_BACKEND_SOURCE_LOCATION=awsbackend
    AWS_BACKEND_DESTINATION_LOCATION=awsbackendmismatch
    GCP_BACKEND_DESTINATION_LOCATION=gcpbackendmismatch
    AZURE_BACKEND_DESTINATION_LOCATION=azurebackendmismatch
    LOCATION_QUOTA_BACKEND=quotabackend

Cloud access and secret keys are configured using::

    AWS_ACCESS_KEY=<ACCESS_KEY>
    AWS_SECRET_KEY=<SECRET_KEY>
    AWS_ACCESS_KEY_2=<ACCESS_KEY>
    AWS_SECRET_KEY_2=<SECRET_KEY>
    AWS_CRR_ACCESS_KEY=<ACCESS_KEY>
    AWS_CRR_SECRET_KEY=<SECRET_KEY>

    GCP_ACCESS_KEY=<ACCESS_KEY>
    GCP_SECRET_KEY=<SECRET_KEY>
    GCP_ACCESS_KEY_2=<ACCESS_KEY>
    GCP_SECRET_KEY_2=<SECRET_KEY>
    GCP_BACKEND_SERVICE_EMAIL=<SERVICE_EMAIL>
    GCP_BACKEND_SERVICE_KEY=<SERVICE_KEY>

    AZURE_ACCOUNT_NAME=<ACCOUNT_NAME>
    AZURE_BACKEND_ENDPOINT=https://<ACCOUNT_NAME>.blob.core.windows.net
    AZURE_SECRET_KEY=<ACCESS_KEY>
    AZURE_ACCOUNT_NAME_2=<ACCOUNT_NAME>
    AZURE_BACKEND_ENDPOINT_2=https://<ACCOUNT_NAME>.blob.core.windows.net
    AZURE_SECRET_KEY_2=<ACCESS_KEY>

Zenko Configuration
+++++++++++++++++++

These settings define access keys to use when calling Zenko endpoints::

    ZENKO_ACCESS_KEY=HEYIMAACCESSKEY
    ZENKO_SECRET_KEY=loOkAtMEImASecRetKEy123=

Test Configuration
++++++++++++++++++

Define these parameters when installing and interacting with the Kubernetes
deployment.

Use them to control test setup and behavior. They are also useful for local
runs. *These variables are optional and only used to override defaults.*
Shown as `<VAR_NAME> : <default>`

ZENKO_HELM_RELEASE : zenko-test
    The Helm release used to install Zenko

ORBIT_HELM_RELEASE : ciutil
    The Helm release used to install orbit-simulator

HELM_NAMESPACE : test-namespace
    The Helm namespace used to install and run all containers

INSTALL_TIMEOUT : 600
    How long (in seconds) to wait for Zenko to stabilize after installation.

IMAGE_REGISTRY : docker.io
    Controls the Docker registry where built images are pushed.

IMAGE_REPO : zenko
    Controls the repo (user) images are tagged using

TAG_OVERRIDE : latest
    Controls the tag used for built images.

VERBOSE :
    If this variable is set (any non-null value), don't suppress ``make``
    commands with ``@``.

NO_SIM :
   If this  variable is set (any non-null value), don't install orbit-simulator
   during test setup

NO_INSTALL :
   If this variable is set, (any non-null value) don't install a Zenko cluster
   during test setup
