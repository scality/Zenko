#!/bin/bash


export HELM_VER=2.16.7
export HELM3_VER=3.5.4
export KUBECTL_VER=1.11.6


yum install -y yum-utils

yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo

yum install -y docker-ce docker-ce-cli containerd.io wget

systemctl start docker

usermod -aG docker eve


# install helm 2 for tiller migration 

wget -q https://storage.googleapis.com/kubernetes-helm/helm-v${HELM_VER}-linux-amd64.tar.gz && \
tar -xvf helm-v${HELM_VER}-linux-amd64.tar.gz && \
mv linux-amd64/helm /usr/bin/

rm -rf linux-amd64

# install helm 3 
wget -q https://get.helm.sh/helm-v${HELM3_VER}-linux-amd64.tar.gz && \ 

tar -xvf helm-v${HELM3_VER}-linux-amd64.tar.gz && \
mv linux-amd64/helm /usr/bin/helm3

# install kubectl
wget -q https://storage.googleapis.com/kubernetes-release/release/v${KUBECTL_VER}/bin/linux/amd64/kubectl -O /usr/bin/kubectl && \
chmod +x /usr/bin/kubectl
