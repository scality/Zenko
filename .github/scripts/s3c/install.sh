#!/usr/bin/env bash

set -ex -o pipefail

# This script is responsible for installing a light-local S3C using the given Federation directory

# Generate x509 certificates
mkdir -p /tmp/scality-certs
CAROOT=/tmp/scality-certs mkcert -install
CAROOT=/tmp/scality-certs mkcert \
    -cert-file /tmp/scality-certs/cert.pem \
    -key-file /tmp/scality-certs/key.pem \
    localhost 127.0.0.1 127.0.0.2 127.0.0.3 127.0.0.4 127.0.0.5 127.0.0.6

if ! grep -q 'node1.scality.com' /etc/hosts; then
    echo '127.0.0.1 node1.scality.com' | sudo tee -a /etc/hosts
fi

# yarn install-s3c --federation-dir="$FEDERATION_DIRECTORY" $@

ls -l $FEDERATION_DIRECTORY

cd $FEDERATION_DIRECTORY

