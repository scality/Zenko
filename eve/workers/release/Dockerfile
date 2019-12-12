FROM ubuntu:bionic

WORKDIR /home/eve/workspace

RUN apt-get update && apt-get install -y \
    curl \
    git \
    python3-buildbot-worker \
    && rm -rf /var/cache/apt

# Helm >= 3.0.0 required to run the nightly release script
ARG HELM_VERSION=3.0.1
RUN curl -sSL https://get.helm.sh/helm-v${HELM_VERSION}-linux-amd64.tar.gz | tar -xvz \
 && install linux-amd64/helm /usr/local/bin \
 && rm -rf linux-amd64

WORKDIR /home/eve/workspace
