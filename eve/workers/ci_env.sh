#!/bin/bash

if [[ -z $ZENKO_HELM_RELEASE ]]; then
    ZENKO_HELM_RELEASE='zenko-test'
fi

if [[ "$1" == "env" ]]; then
  CLI_FLAG="env"
  CI_PREFIX=""
  printf -- "\
--env ZENKO_HELM_RELEASE=$ZENKO_HELM_RELEASE \
--env HELM_NAMESPACE=$HELM_NAMESPACE \
--env STAGE=$STAGE \
--env NUM_CPUS=1 \
--env INSTALL_TIMEOUT=$INSTALL_TIMEOUT \
--env S3_FUZZER=$S3_FUZZER "

elif [[ "$1" == "set" ]]; then
  CLI_FLAG="set"
  CI_PREFIX="ci."
else
  echo "usage: ci_env.sh [set|env]"
fi

FLAGS="\
--$CLI_FLAG ${CI_PREFIX}RING_S3C_ACCESS_KEY=$RING_S3C_ACCESS_KEY \
--$CLI_FLAG ${CI_PREFIX}RING_S3C_SECRET_KEY=$RING_S3C_SECRET_KEY \
--$CLI_FLAG ${CI_PREFIX}RING_S3C_ENDPOINT=$RING_S3C_ENDPOINT \
--$CLI_FLAG ${CI_PREFIX}NFS_BACKEND=$NFS_BACKEND \
--$CLI_FLAG ${CI_PREFIX}NFS_SERVER=$NFS_SERVER \
--$CLI_FLAG ${CI_PREFIX}NFS_BUCKET_NAME=$NFS_BUCKET_NAME \
--$CLI_FLAG ${CI_PREFIX}GCP_ACCESS_KEY=$GCP_ACCESS_KEY \
--$CLI_FLAG ${CI_PREFIX}GCP_ACCESS_KEY_2=$GCP_ACCESS_KEY_2 \
--$CLI_FLAG ${CI_PREFIX}GCP_SECRET_KEY=$GCP_SECRET_KEY \
--$CLI_FLAG ${CI_PREFIX}GCP_SECRET_KEY_2=$GCP_SECRET_KEY_2 \
--$CLI_FLAG ${CI_PREFIX}GCP_BACKEND_SERVICE_KEY=$GCP_PRIV_KEY \
--$CLI_FLAG ${CI_PREFIX}GCP_BACKEND_SERVICE_EMAIL=$GCP_BACKEND_SERVICE_EMAIL \
--$CLI_FLAG ${CI_PREFIX}AWS_ENDPOINT=$AWS_ENDPOINT \
--$CLI_FLAG ${CI_PREFIX}AWS_ACCESS_KEY=$AWS_ACCESS_KEY \
--$CLI_FLAG ${CI_PREFIX}AWS_ACCESS_KEY_2=$AWS_ACCESS_KEY_2 \
--$CLI_FLAG ${CI_PREFIX}AWS_SECRET_KEY=$AWS_SECRET_KEY \
--$CLI_FLAG ${CI_PREFIX}AWS_SECRET_KEY_2=$AWS_SECRET_KEY_2 \
--$CLI_FLAG ${CI_PREFIX}AWS_CRR_ACCESS_KEY=$AWS_ACCESS_KEY \
--$CLI_FLAG ${CI_PREFIX}AWS_CRR_SECRET_KEY=$AWS_SECRET_KEY \
--$CLI_FLAG ${CI_PREFIX}AZURE_ACCOUNT_NAME=$AZURE_ACCOUNT_NAME \
--$CLI_FLAG ${CI_PREFIX}AZURE_ACCOUNT_NAME_2=$AZURE_ACCOUNT_NAME_2 \
--$CLI_FLAG ${CI_PREFIX}AZURE_SECRET_KEY=$AZURE_SECRET_KEY \
--$CLI_FLAG ${CI_PREFIX}AZURE_SECRET_KEY_2=$AZURE_SECRET_KEY_2 \
--$CLI_FLAG ${CI_PREFIX}AZURE_BACKEND_ENDPOINT=$AZURE_BACKEND_ENDPOINT \
--$CLI_FLAG ${CI_PREFIX}AZURE_BACKEND_ENDPOINT_2=$AZURE_BACKEND_ENDPOINT_2 \
--$CLI_FLAG ${CI_PREFIX}AWS_CRR_BUCKET_NAME=$AWS_CRR_BUCKET_NAME \
--$CLI_FLAG ${CI_PREFIX}AWS_BUCKET_NAME=$AWS_BUCKET_NAME \
--$CLI_FLAG ${CI_PREFIX}AWS_BUCKET_NAME_2=$AWS_BUCKET_NAME_2 \
--$CLI_FLAG ${CI_PREFIX}AZURE_CRR_BUCKET_NAME=$AZURE_CRR_BUCKET_NAME \
--$CLI_FLAG ${CI_PREFIX}AZURE_BUCKET_NAME=$AZURE_BUCKET_NAME \
--$CLI_FLAG ${CI_PREFIX}AZURE_BUCKET_NAME_2=$AZURE_BUCKET_NAME_2 \
--$CLI_FLAG ${CI_PREFIX}GCP_BUCKET_NAME=$GCP_BUCKET_NAME \
--$CLI_FLAG ${CI_PREFIX}GCP_BUCKET_NAME_2=$GCP_BUCKET_NAME_2 \
--$CLI_FLAG ${CI_PREFIX}GCP_CRR_BUCKET_NAME=$GCP_CRR_BUCKET_NAME \
--$CLI_FLAG ${CI_PREFIX}GCP_CRR_MPU_BUCKET_NAME=$GCP_CRR_MPU_BUCKET_NAME \
--$CLI_FLAG ${CI_PREFIX}GCP_MPU_BUCKET_NAME=$GCP_MPU_BUCKET_NAME \
--$CLI_FLAG ${CI_PREFIX}GCP_MPU_BUCKET_NAME_2=$GCP_MPU_BUCKET_NAME_2 \
--$CLI_FLAG ${CI_PREFIX}AWS_CRR_SRC_BUCKET_NAME=$AWS_CRR_SRC_BUCKET_NAME \
--$CLI_FLAG ${CI_PREFIX}GCP_CRR_SRC_BUCKET_NAME=$GCP_CRR_SRC_BUCKET_NAME \
--$CLI_FLAG ${CI_PREFIX}AZURE_CRR_SRC_BUCKET_NAME=$AZURE_CRR_SRC_BUCKET_NAME \
--$CLI_FLAG ${CI_PREFIX}TRANSIENT_SRC_BUCKET_NAME=$TRANSIENT_SRC_BUCKET_NAME \
--$CLI_FLAG ${CI_PREFIX}MULTI_CRR_SRC_BUCKET_NAME=$MULTI_CRR_SRC_BUCKET_NAME \
--$CLI_FLAG ${CI_PREFIX}AWS_BACKEND_SOURCE_LOCATION=$AWS_BACKEND_SOURCE_LOCATION \
--$CLI_FLAG ${CI_PREFIX}AWS_BACKEND_DESTINATION_LOCATION=$AWS_BACKEND_DESTINATION_LOCATION \
--$CLI_FLAG ${CI_PREFIX}AZURE_BACKEND_DESTINATION_LOCATION=$AZURE_BACKEND_DESTINATION_LOCATION \
--$CLI_FLAG ${CI_PREFIX}GCP_BACKEND_DESTINATION_LOCATION=$GCP_BACKEND_DESTINATION_LOCATION \
--$CLI_FLAG ${CI_PREFIX}CEPH_BUCKET_NAME=$CEPH_BUCKET_NAME \
--$CLI_FLAG ${CI_PREFIX}CEPH_CRR_BUCKET_NAME=$CEPH_CRR_BUCKET_NAME \
--$CLI_FLAG ${CI_PREFIX}CEPH_CRR_SRC_BUCKET_NAME=$CEPH_CRR_SRC_BUCKET_NAME \
--$CLI_FLAG ${CI_PREFIX}LOCATION_QUOTA_BACKEND=$LOCATION_QUOTA_BACKEND \
--$CLI_FLAG ${CI_PREFIX}RING_S3C_BACKEND_SOURCE_LOCATION=$RING_S3C_BACKEND_SOURCE_LOCATION \
--$CLI_FLAG ${CI_PREFIX}ZENKO_ACCESS_KEY=$ZENKO_ACCESS_KEY \
--$CLI_FLAG ${CI_PREFIX}ZENKO_SECRET_KEY=$ZENKO_SECRET_KEY \
--$CLI_FLAG ${CI_PREFIX}CLOUDSERVER_ENDPOINT=http://$ZENKO_HELM_RELEASE-cloudserver:80 \
--$CLI_FLAG ${CI_PREFIX}CLOUDSERVER_HOST=$ZENKO_HELM_RELEASE-cloudserver \
--$CLI_FLAG ${CI_PREFIX}RING_S3C_INGESTION_SRC_BUCKET_NAME=$RING_S3C_INGESTION_SRC_BUCKET_NAME"


# Optional variable that only need to be passed if set
if [ -n "$PYTHON_ARGS" ]; then
    FLAGS="$FLAGS --$CLI_FLAG ${CI_PREFIX}PYTHON_ARGS=\"$PYTHON_ARGS\""
fi

echo "$FLAGS"
