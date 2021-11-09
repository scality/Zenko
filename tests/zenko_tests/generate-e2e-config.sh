#!/bin/sh

set -eux

envsubst < 'e2e-config.yaml.template' > 'e2e-config.yaml'

cat ./e2e-config.yaml