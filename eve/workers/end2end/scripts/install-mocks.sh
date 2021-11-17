#! /bin/sh

set -exu

NAMESPACE=${1:-default}

kubectl create \
    -f ../mocks/azure-mock.yaml \
    -f ../mocks/aws-mock.yaml \
    --namespace ${NAMESPACE} && \
kubectl create \
    configmap aws-mock \
    --from-file=../mocks/aws/mock-metadata.tar.gz \
    --namespace ${NAMESPACE}

kubectl wait \
    --for=condition=Ready \
    --timeout=10m \
    pod -l component=mock \
    --namespace ${NAMESPACE}

kubectl get \
    pod -l component=mock \
    --namespace ${NAMESPACE}
