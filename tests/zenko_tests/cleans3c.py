#!/usr/bin/env python2

from boto3 import Session
import os
import logging

logging.basicConfig(level=logging.INFO)
_log = logging.getLogger('cleans3c')

def get_env(key, default=None, error=False):
    if not error:
        return os.environ.get(key, default)
    return os.environ[key]

RING_S3C_ACCESS_KEY = get_env('RING_S3C_ACCESS_KEY')
RING_S3C_SECRET_KEY = get_env('RING_S3C_SECRET_KEY')
RING_S3C_INGESTION_SRC_BUCKET_NAME = get_env('RING_S3C_INGESTION_SRC_BUCKET_NAME')
RING_S3C_ENDPOINT = get_env('RING_S3C_ENDPOINT')
VERIFY_CERTIFICATES = get_env('VERIFY_CERTIFICATES', False)

s3c = Session(aws_access_key_id=RING_S3C_ACCESS_KEY,
            aws_secret_access_key=RING_S3C_SECRET_KEY)
ring_s3c_client = s3c.resource('s3', endpoint_url=RING_S3C_ENDPOINT,
                      verify=VERIFY_CERTIFICATES)

def bucket_safe_delete(bucketname):
    try:
        bucket = ring_s3c_client.Bucket(bucketname)
        _log.info('Deleting bucket %s' % bucket.name)
        bucket.objects.all().delete()
        bucket.delete()
    except Exception as exp:
        _log.info('Error creating bucket %s - %s' % (bucket.name, str(exp)))
        raise exp

_log.info('Removing S3C buckets...')
bucket_safe_delete(RING_S3C_INGESTION_SRC_BUCKET_NAME)
