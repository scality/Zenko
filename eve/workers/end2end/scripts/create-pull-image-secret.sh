#!/bin/sh

set -exu

kubectl create secret generic zenko-operator-image-pull --dry-run -o yaml \
    --from-file=.dockerconfigjson=$HOME/.docker/config.json \
    --type=kubernetes.io/dockerconfigjson | kubectl apply -f -

 kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "zenko-operator-image-pull"}]}'
