FROM ubuntu:bionic

ARG BUILDBOT_VERSION=0.9.12

WORKDIR /home/eve/workspace

RUN apt-get update && apt-get install -y \
    git \
    wget \
    python3-buildbot-worker \
    && adduser -u 1042 --home /home/eve eve \
    && chown -R eve:eve /home/eve

ARG HELM_VERSION=2.13.1
RUN wget -qO- https://storage.googleapis.com/kubernetes-helm/helm-v${HELM_VERSION}-linux-amd64.tar.gz | tar -xvz \
 && install linux-amd64/helm /usr/local/bin \
 && rm -rf linux-amd64

USER eve

RUN helm init --client-only && helm plugin install https://github.com/chartmuseum/helm-push
