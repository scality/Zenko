#! /bin/bash

./build.sh
kubectl kustomize . | kubectl apply -f - -n zenko
