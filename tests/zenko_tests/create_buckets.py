#!/usr/bin/env python
from boto3 import Session
import os
import logging

logging.basicConfig(level=logging.INFO)
_log = logging.getLogger('create_buckets')

def get_env(key, default=None, error=False):
    if not error:
        return os.environ.get(key, default)
    return os.environ[key]

def bucket_safe_create(bucket):
    try:
        _log.info('Creating bucket %s' % bucket.name)
        bucket.create()
    except bucket.meta.client.exceptions.BucketAlreadyOwnedByYou:
        _log.info('Bucket %s already exists!' % bucket.name)
    except Exception as exp:  # pylint: disable=broad-except
        _log.info('Error creating bucket %s - %s' % (bucket.name, str(exp)))
        raise exp

VERIFY_CERTIFICATES = get_env('VERIFY_CERTIFICATES', False)
RING_S3C_ACCESS_KEY = get_env('RING_S3C_ACCESS_KEY')
RING_S3C_SECRET_KEY = get_env('RING_S3C_SECRET_KEY')
RING_S3C_INGESTION_SRC_BUCKET_NAME = get_env('RING_S3C_INGESTION_SRC_BUCKET_NAME')
RING_S3C_ENDPOINT = get_env('RING_S3C_ENDPOINT')

s3c = Session(aws_access_key_id=RING_S3C_ACCESS_KEY,
            aws_secret_access_key=RING_S3C_SECRET_KEY)
ring_s3c_client = s3c.resource('s3', endpoint_url=RING_S3C_ENDPOINT,
                      verify=VERIFY_CERTIFICATES)

## Creating S3C buckets
_log.info('Creating S3C buckets...')
bucket_safe_create(ring_s3c_client.Bucket(RING_S3C_INGESTION_SRC_BUCKET_NAME))
ring_s3c_client.Bucket(RING_S3C_INGESTION_SRC_BUCKET_NAME).Versioning().enable()

