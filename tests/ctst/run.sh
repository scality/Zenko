#!/bin/bash
set -exu

# script used for local testing

COMMAND=${1:-"premerge"}
PARALLEL_RUNS=${2:-4}

# Zenko Version
VERSION=$(cat ../../VERSION | grep -Po 'VERSION="\K[^"]*')

# Setting CTST world params
WORLD_PARAMETERS='{"subdomain":"'${SUBDOMAIN}'","ssl":false,"port":"'${ZENKO_PORT}'","AccountName":"'${ZENKO_ACCOUNT_NAME}'","AccountAccessKey":"'${ZENKO_ACCESS_KEY}'","AccountSecretKey":"'${ZENKO_SECRET_KEY}'"}'

# Running end2end ctst tests
kubectl run ctst-end2end \
        --pod-running-timeout=5m \
        --image=$E2E_IMAGE \
        --restart=Never \
        --rm \
        --attach=True \
        --image-pull-policy=Always \
        --env=TARGET_VERSION=$VERSION  \
        -- ./run "$COMMAND" $WORLD_PARAMETERS "--parallel $PARALLEL_RUNS"
