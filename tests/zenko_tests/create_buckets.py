#!/usr/bin/env python
from boto3 import Session
from azure.storage.blob import BlobServiceClient
from azure.core.credentials import AzureNamedKeyCredential
from azure.core.exceptions import ResourceExistsError
from azure.storage.queue import QueueServiceClient
import os
import logging

logging.basicConfig(level=logging.INFO)
_log = logging.getLogger('create_buckets')

VERIFY_CERTIFICATES = os.environ.get('VERIFY_CERTIFICATES', 'false').lower() == 'true'

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
    """
    Put an object in a bucket
    """
    try:
        _log.info('Putting object %s' % object_name)
        obj = bucket.Object(object_name)
        obj.put(Body=body)
    except Exception as exp:
        _log.info('Error putting object %s - %s' % (bucket.name, object_name, str(exp)))
        raise exp
    
def put_singlepart_mpu(bucket, object_name, body):
    """
    Put an object in a bucket using a single part multipart upload
    """
    try:
        _log.info('Putting object %s using multipart upload' % object_name)
        mpu = bucket.meta.client.create_multipart_upload(
            Bucket=bucket.name,
            Key=object_name
        )
        response = bucket.meta.client.upload_part(
            Body=body,
            Bucket=bucket.name,
            Key=object_name,
            PartNumber=1,
            UploadId=mpu['UploadId']
        )
        bucket.meta.client.complete_multipart_upload(
            Bucket=bucket.name,
            Key=object_name,
            UploadId=mpu['UploadId'],
            MultipartUpload={
                'Parts': [{
                    'PartNumber': 1,
                    'ETag': response['ETag']
                }]
            }
        )
    except Exception as exp:
        _log.error('Error in multipart upload for object %s - %s' % (object_name, str(exp)))
        raise exp

def create_ring_buckets():
    RING_S3C_ACCESS_KEY = get_env('RING_S3C_ACCESS_KEY')
    RING_S3C_SECRET_KEY = get_env('RING_S3C_SECRET_KEY')
    RING_S3C_ENDPOINT = get_env('RING_S3C_ENDPOINT')
    ENABLE_RING_TESTS = get_env('ENABLE_RING_TESTS')
    ## test bucket names
    RING_S3C_INGESTION_SRC_BUCKET_NAME = get_env('RING_S3C_INGESTION_SRC_BUCKET_NAME')
    RING_S3C_INGESTION_SRC_NON_VERSIONED_BUCKET_NAME = get_env('RING_S3C_INGESTION_SRC_NON_VERSIONED_BUCKET_NAME')
    RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE = get_env('RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE')

    # Disable if Ring is not enabled
    if ENABLE_RING_TESTS == "false":
        return

    s3c = Session(aws_access_key_id=RING_S3C_ACCESS_KEY,
            aws_secret_access_key=RING_S3C_SECRET_KEY)
    ring_s3c_client = s3c.resource('s3', endpoint_url=RING_S3C_ENDPOINT,
                      verify=VERIFY_CERTIFICATES)

    versioned_bucket = ring_s3c_client.Bucket(RING_S3C_INGESTION_SRC_BUCKET_NAME)
    non_versioned_bucket = ring_s3c_client.Bucket(RING_S3C_INGESTION_SRC_NON_VERSIONED_BUCKET_NAME)

    ## Creating S3C buckets
    _log.info('Creating S3C buckets...')
    bucket_safe_create(versioned_bucket)
    bucket_safe_create(non_versioned_bucket)

    ## Adding non versioned objects before test execution to avoid
    ## having to create the location mid tests which might cause flakiness.
    ## A RING location can only be created if the bucket is versioned, and
    ## once versioning is enabled it cannot be disabled.
    _log.info('Putting non versioned objects...')
    for i in range(int(RING_S3C_INGESTION_NON_VERSIONED_OBJECT_COUNT_PER_TYPE)):
        put_file(non_versioned_bucket, 'simple-%d' % i, b'data')
        put_file(non_versioned_bucket, 'zerobyte-%d' % i, b'')
        put_singlepart_mpu(non_versioned_bucket, 'mpu-singlepart-%d' % i, b'mpudata')

    ## Enabling versioning
    _log.info('Enabling versioning on buckets...')
    versioned_bucket.Versioning().enable()
    non_versioned_bucket.Versioning().enable()

def create_aws_buckets():
    AWS_ACCESS_KEY = get_env('AWS_ACCESS_KEY')
    AWS_SECRET_KEY = get_env('AWS_SECRET_KEY')
    AWS_ENDPOINT = get_env('AWS_ENDPOINT')
    AWS_FAIL_BUCKET_NAME = get_env('AWS_FAIL_BUCKET_NAME')
    AWS_REPLICATION_CTST_BUCKET_NAME = get_env('AWS_REPLICATION_CTST_BUCKET_NAME')

    s3c = Session(aws_access_key_id=AWS_ACCESS_KEY,
            aws_secret_access_key=AWS_SECRET_KEY)
    aws_s3c_client = s3c.resource('s3', endpoint_url=AWS_ENDPOINT,
            verify=VERIFY_CERTIFICATES)

    ## Creating AWS buckets
    _log.info('Creating AWS buckets...')
    bucket_safe_create(aws_s3c_client.Bucket(AWS_FAIL_BUCKET_NAME))
    bucket_safe_create(aws_s3c_client.Bucket(AWS_REPLICATION_CTST_BUCKET_NAME))
    aws_s3c_client.Bucket(AWS_FAIL_BUCKET_NAME).Versioning().enable()
    aws_s3c_client.Bucket(AWS_REPLICATION_CTST_BUCKET_NAME).Versioning().enable()

def create_azure_containers():
    AZURE_BACKEND_ENDPOINT = get_env("AZURE_BACKEND_ENDPOINT")
    AZURE_ACCOUNT_NAME = get_env("AZURE_ACCOUNT_NAME")
    AZURE_SECRET_KEY = get_env("AZURE_SECRET_KEY")
    AZURE_CRR_BUCKET_NAME = get_env("AZURE_CRR_BUCKET_NAME")
    AZURE_ARCHIVE_BUCKET_NAME = get_env("AZURE_ARCHIVE_BUCKET_NAME")
    AZURE_ARCHIVE_BUCKET_NAME_2 = get_env("AZURE_ARCHIVE_BUCKET_NAME_2")

    credential = AzureNamedKeyCredential(name=AZURE_ACCOUNT_NAME,
            key=AZURE_SECRET_KEY)
    blob_service_client = BlobServiceClient(account_url=AZURE_BACKEND_ENDPOINT,
            credential=credential,
            connection_verify=VERIFY_CERTIFICATES)
    ## Creating Azure buckets
    _log.info('Creating Azure buckets...')
    for bucket_name in [AZURE_CRR_BUCKET_NAME, AZURE_ARCHIVE_BUCKET_NAME, AZURE_ARCHIVE_BUCKET_NAME_2]:
        try:
            _log.info('Creating bucket %s' % bucket_name)
            blob_service_client.create_container(name=bucket_name)
        except ResourceExistsError:
            _log.info('Container %s already exists!' % bucket_name)

def create_azure_queues():
    AZURE_BACKEND_QUEUE_ENDPOINT = get_env("AZURE_BACKEND_QUEUE_ENDPOINT")
    AZURE_ACCOUNT_NAME = get_env("AZURE_ACCOUNT_NAME")
    AZURE_SECRET_KEY = get_env("AZURE_SECRET_KEY")
    AZURE_ARCHIVE_QUEUE_NAME = get_env("AZURE_ARCHIVE_QUEUE_NAME")

    credential = AzureNamedKeyCredential(name=AZURE_ACCOUNT_NAME,
            key=AZURE_SECRET_KEY)

    queue_client = QueueServiceClient(account_url=AZURE_BACKEND_QUEUE_ENDPOINT,
            credential=credential,
            connection_verify=VERIFY_CERTIFICATES)

    ## Creating Azure queue
    _log.info('Creating Azure queues...')
    try:
        _log.info('Creating queue %s' % AZURE_ARCHIVE_QUEUE_NAME)
        queue_client.create_queue(name=AZURE_ARCHIVE_QUEUE_NAME)
    except ResourceExistsError:
        _log.info('Queue %s already exists!' % AZURE_ARCHIVE_QUEUE_NAME)
