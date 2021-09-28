FROM ubuntu:bionic

ENV LANG C.UTF-8

ENV KUBECTL_VERSION 1.18.3
ENV KIND_VERSION v0.8.1
ENV HELM_VERSION v3.2.3
ENV YQ_VERSION v4.6.3
ENV YQ_BINARY yq_linux_amd64

VOLUME ["/artifacts", "/home/eve/workspace"]

# install base dependencies
RUN apt-get update && apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    git \
    gnupg2 \
    python3-buildbot-worker \
    software-properties-common \
    m4 \
    gettext-base \
    jq \
    wget

# install main dependencies
RUN curl -Lo /usr/local/bin/kind https://kind.sigs.k8s.io/dl/${KIND_VERSION}/kind-$(uname)-amd64 && \
    chmod +x /usr/local/bin/kind && \
    curl -sSL https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz | tar -xvz && \
    install linux-amd64/helm /usr/local/bin && \
    rm -rf linux-amd64 && \
    curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
    add-apt-repository "deb https://apt.kubernetes.io/ kubernetes-xenial main" && \
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add - && \
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" && \
    apt-get update && apt-get install -y \
    docker-ce-cli \
    kubectl=${KUBECTL_VERSION}*
RUN wget https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/${YQ_BINARY} -O /usr/bin/yq && \
    chmod +x /usr/bin/yq

WORKDIR /home/eve/workspace

CMD buildbot-worker create-worker . "$BUILDMASTER:$BUILDMASTER_PORT" "$WORKERNAME" "$WORKERPASS" \
    && buildbot-worker start --nodaemon
