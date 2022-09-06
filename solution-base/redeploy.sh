#! /bin/bash

./build.sh

sed -e s/SOLUTION_ENV/zenko/g -e s/MONGODB_STORAGE_CLASS/ssd-ext4/g < _build/root/deploy/mongodb-sharded-9-nodes.yaml > mongodb-sharded-9-nodes.yaml

kubectl kustomize . | kubectl apply -f - -n zenko
