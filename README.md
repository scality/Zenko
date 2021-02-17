# Zenko

![Zenko logo](res/zenko.io-logo-wide-bw.png)

[![Documentation Status](https://readthedocs.org/projects/zenko/badge/?version=latest)](https://zenko.readthedocs.io/en/latest/?badge=latest)

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

You can find the roadmap, features in development and bugs for the next release on [Zenko Jira Project](https://scality.atlassian.net/projects/ZENKOIO/issues/ZENKOIO-19?filter=allopenissues) as well as for the future releases.
At this time if you have suggestions or questions you can leave the comments on the [forum](https://forum.zenko.io/) or create issues on this repository.

If you'd like to contribute, please review the
[Contributing Guidelines](https://github.com/scality/Guidelines/blob/development/8.1/CONTRIBUTING.md).

## Overview

This repository includes installation resources to deploy the full Zenko
stack on the [Kubernetes](https://kubernetes.io/) orchestration system.

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

## Zenko in Production

- Includes high availability (HA)
- Asks for pre-existing volumes

[Zenko Kubernetes Helm Chart deployment](./kubernetes)

[Deploying a HA Kubernetes cluster](https://github.com/scality/metal-k8s)
