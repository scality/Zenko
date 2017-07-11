# Zenko

![Zenko logo](res/zenko.io-logo-color-cmyk.png)

Zenko is  [Scality](http://www.scality.com/)’s Open Source Multi-Cloud Data Controller.

Learn more at  [Zenko.io](http://www.zenko.io/)

## [May I offer you some lovely documentation?](http://zenko.readthedocs.io)

## Contributing

In order to contribute, please follow the
[Contributing Guidelines](
https://github.com/scality/Guidelines/blob/master/CONTRIBUTING.md).

## Overview

This repository will include installation resources to deploy the full Zenko
stack over different orchestration systems.

We started with [Docker Swarm](https://docs.docker.com/engine/swarm/) but others
like [Kubernetes](https://kubernetes.io/) will follow.

The stack is composed of:
- [nginx](https://nginx.org/en/),
- [Scality S3 server](https://github.com/scality/S3),
- [data and metadata deamon (dmd)](http://s3-server.readthedocs.io/en/latest/ARCHITECTURE/#data-metadata-daemon-architecture-and-operational-guide),
- [redis](https://redis.io/)
- all magically configured to talk to each other.

## [Testing Zenko with Docker Swarm](./swarm-testing)

Simple Zenko setup for quick testing with non-production data

## [Zenko in production with Docker Swarm](./swarm-production)

- Includes high availability (HA)
- Asks for pre-existing volumes
