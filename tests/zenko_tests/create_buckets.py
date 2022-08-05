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

def put_file(bucket, object_name, body):
    try:
        _log.info('Putting object %s' % object_name)
        obj = bucket.Object(object_name)
        obj.put(Body=body)
    except Exception as exp:  # pylint: disable=broad-except
        _log.info('Error putting object %s - %s' % (bucket.name, object_name, str(exp)))
        raise exp

def create_ring_buckets():
    VERIFY_CERTIFICATES = get_env('VERIFY_CERTIFICATES', False)
    RING_S3C_ACCESS_KEY = get_env('RING_S3C_ACCESS_KEY')
    RING_S3C_SECRET_KEY = get_env('RING_S3C_SECRET_KEY')
    RING_S3C_INGESTION_SRC_BUCKET_NAME = get_env('RING_S3C_INGESTION_SRC_BUCKET_NAME')
    RING_S3C_INGESTION_SRC_BUCKET_NAME_NON_VERSIONED = get_env('RING_S3C_INGESTION_SRC_BUCKET_NAME_NON_VERSIONED')
    RING_S3C_ENDPOINT = get_env('RING_S3C_ENDPOINT')
    ENABLE_RING_TESTS = get_env('ENABLE_RING_TESTS')

    # Disable if Ring is not enabled
    if ENABLE_RING_TESTS == "false":
        return
    RING_S3C_OBJECT_KEY_NON_VERSIONED = get_env('RING_S3C_OBJECT_KEY_NON_VERSIONED')
    RING_S3C_OBJECT_KEY_ZERO_BYTE_NON_VERSIONED = get_env('RING_S3C_OBJECT_KEY_ZERO_BYTE_NON_VERSIONED')

    s3c = Session(aws_access_key_id=RING_S3C_ACCESS_KEY,
            aws_secret_access_key=RING_S3C_SECRET_KEY)
    ring_s3c_client = s3c.resource('s3', endpoint_url=RING_S3C_ENDPOINT,
                      verify=VERIFY_CERTIFICATES)

    ## Creating S3C buckets
    _log.info('Creating S3C buckets...')
    bucket_safe_create(ring_s3c_client.Bucket(RING_S3C_INGESTION_SRC_BUCKET_NAME))

    ## Creating bucket that wil contain non versioned objects
    non_versioned_bucket = ring_s3c_client.Bucket(RING_S3C_INGESTION_SRC_BUCKET_NAME_NON_VERSIONED)
    bucket_safe_create(non_versioned_bucket)

    ## if non versioned bucket already has versioning enabled, this mean that e2e configuration
    ## was already executed by some other CI stage
    were_buckets_created_by_other_stage = non_versioned_bucket.Versioning().status == 'Enabled'
    if were_buckets_created_by_other_stage:
        _log.info('buckets already exist skipping...')
        return

    ## Adding non versioned objects
    ## these are used by the oob with replication e2e tests
    ## to test if non versioned oob objects get replicated correctly
    _log.info('Putting non versioned objects...')
    put_file(non_versioned_bucket, RING_S3C_OBJECT_KEY_NON_VERSIONED, b'data')
    put_file(non_versioned_bucket, RING_S3C_OBJECT_KEY_ZERO_BYTE_NON_VERSIONED, b'')

    ## Enable versioning of buckets
    _log.info('Enabling versioning of buckets...')
    ring_s3c_client.Bucket(RING_S3C_INGESTION_SRC_BUCKET_NAME).Versioning().enable()
    ring_s3c_client.Bucket(RING_S3C_INGESTION_SRC_BUCKET_NAME_NON_VERSIONED).Versioning().enable()
