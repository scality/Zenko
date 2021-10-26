#!/bin/bash

KUBECTL_VERSION=1.18.3
KIND_VERSION=v0.11.1
HELM_VERSION=v3.5.3
YQ_VERSION=v4.6.3
YQ_BINARY=yq_linux_amd64

apt-get update && apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    git \
    gnupg-agent \
    gnupg2 \
    software-properties-common \
    m4 \
    gettext-base \
    jq \
    wget

# Install docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io
adduser eve docker

# Install kubectl
curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg
echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | tee /etc/apt/sources.list.d/kubernetes.list
apt-get update && apt-get install -y "kubectl=$KUBECTL_VERSION-*"

# Install Kind
curl -Lo ./kind https://github.com/kubernetes-sigs/kind/releases/download/$KIND_VERSION/kind-linux-amd64
chmod +x ./kind
mv kind /usr/local/bin/

# Install helm
curl -sSL https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz | tar -xvz
install linux-amd64/helm /usr/local/bin
rm -rf linux-amd64

# Install yq
wget https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/${YQ_BINARY} -O /usr/local/bin/yq
chmod +x /usr/local/bin/yq
