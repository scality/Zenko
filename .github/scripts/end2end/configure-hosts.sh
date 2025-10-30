#!/bin/bash
set -exu

echo "127.0.0.1 iam.zenko.local ui.zenko.local s3-local-file.zenko.local keycloak.zenko.local \
    sts.zenko.local management.zenko.local s3.zenko.local website.mywebsite.com utilization.zenko.local" | sudo tee -a /etc/hosts
