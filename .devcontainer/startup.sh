#!/bin/bash

# TODO: Add proper etc hosts
echo "127.0.0.1 local" | sudo tee -a /etc/hosts

export GIT_ACCESS_TOKEN=${GITHUB_TOKEN}
echo $REGISTRY_PASSWORD | docker login registry.scality.com -u $REGISTRY_LOGIN --password-stdin
