# Cosmos

This directory holds most of the code that corresponds to the Cosmos ingestion
framework. The subdirectory layout is as follows:

- `/api` & `/clientset`

    These directories have the appropiate Go packages for interacting with
    Cosmos CRs in the Kubernetes API.

- `/operator`

    This directory contains the necessary files for building the Cosmos Helm
    Operator Docker image.

- `/scheduler`

    This directory holds the code for the Orchestration Daemon.

- `/vendor`

    This directory contains the dependencies for all the Cosmos Go packages.
