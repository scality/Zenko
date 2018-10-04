# Zenko

![Zenko logo](res/zenko.io-logo-wide-bw.png)

Zenko is  [Scality](http://www.scality.com/)’s open source multi-cloud data
controller.

Zenko provides a unified namespace, access API, and search capabilities for
data stored locally (using Docker volumes or Scality RING) or in public cloud
storage services like [Amazon S3](https://aws.amazon.com/s3),
[Microsoft Azure Blob storage](https://azure.microsoft.com/en-us/services/storage/blobs/),
or [Google Cloud Storage](https://cloud.google.com/storage/).

Learn more at  [Zenko.io](http://www.zenko.io/).

## [Full Documentation](http://zenko.readthedocs.io)

## Contributing

If you'd like to contribute, please review the
[Contributing Guidelines](https://github.com/scality/Guidelines/blob/master/CONTRIBUTING.md).

## Overview

This repository includes installation resources to deploy the full Zenko
stack over different orchestration systems.

Currently we have [Kubernetes](https://kubernetes.io/) and
[Docker Swarm](https://docs.docker.com/engine/swarm/).

### Zenko Stack

The stack consists of:
- [nginx](https://nginx.org/en/)
- [Zenko Cloudserver](https://github.com/scality/S3)
- [Zenko Backbeat Async Replication Engine](https://github.com/scality/backbeat)
- [MongoDB](https://www.mongodb.com)
- [redis](https://redis.io/)

all configured to talk to each other.

## Testing Zenko

Simple Zenko setup for quick testing with non-production data:

- [Zenko Single-Node Kubernetes](./docs/minikube.md)
- [Zenko Docker Swarm Testing](./swarm-testing)

## Zenko in Production

- Includes high availability (HA)
- Asks for pre-existing volumes

[Zenko Kubernetes Helm Chart deployment](./kubernetes)

[Deploying a HA Kubernetes cluster](https://github.com/scality/metal-k8s)

[Zenko Docker Swarm HA Deployment](./swarm-production)
