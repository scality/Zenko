#!/bin/bash


# install docker and kubectl
apt-get update && apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -

add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"

add-apt-repository "deb https://apt.kubernetes.io/ kubernetes-xenial main"

apt-get update && apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    kubectl


# install kind

curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.8.1/kind-$(uname)-amd64
chmod +x ./kind
mv ./kind /usr/local/bin/kind


# Add user eve to docker group
adduser eve docker
