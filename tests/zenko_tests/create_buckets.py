#!/usr/bin/env python
from boto3 import Session
from kubernetes import client, config
import time
import sys
import os
import logging
import re

IGNORED_PODS = [
    r'.+bootstrap',
    'failed',
    'pending',
    'kafkaclient',
    'utils'
]

IGNORED_PODS = [re.compile(x) for x in IGNORED_PODS]

FAIL_STATUS = [
    'CrashLoopBackOff',
    'Error',
]

def is_ignored(name):
    for ignored in IGNORED_PODS:
        if ignored.search(name):
            return True
    return False


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

def wait_for_pods(delete, timeout):
    _log.info('Waiting for Zenko services to stabilize')
    config.load_incluster_config()
    v1 = client.CoreV1Api()
    delete_opt = client.V1DeleteOptions()

    timeout = time.time() + timeout
    while time.time() < timeout:
        ret = v1.list_namespaced_pod(K8S_NAMESPACE)
        passed = True
        for i in ret.items:
            if i.status.container_statuses:
                for container in i.status.container_statuses:
                    if is_ignored(container.name):
                        continue
                    elif not container.ready and container.state.waiting:
                        if delete and container.state.waiting.reason in FAIL_STATUS:
                            _log.info('%s is in %s, restarting' % (container.name, container.state.waiting.reason))
                            v1.delete_namespaced_pod(i.metadata.name, K8S_NAMESPACE, body=delete_opt, grace_period_seconds=0)
                        passed = False
        if not passed:
            time.sleep(1)
        else:
            break

    if not passed:
      _log.info('Containers have not become ready and %d has elasped' % timeout)
      sys.exit(1)
    else:
      _log.info('Zenko services have stabilized successfully')

TIMEOUT = int(get_env('INSTALL_TIMEOUT'))

K8S_NAMESPACE = os.getenv('HELM_NAMESPACE')
ZENKO_HELM_RELEASE = os.getenv('ZENKO_HELM_RELEASE')
ZENKO_ENDPOINT = get_env('CLOUDSERVER_FRONT_ENDPOINT',
                         'http://%s-cloudserver:80' % ZENKO_HELM_RELEASE)
VERIFY_CERTIFICATES = get_env('VERIFY_CERTIFICATES', False)

ZENKO_ACCESS_KEY = get_env('ZENKO_ACCESS_KEY')
ZENKO_SECRET_KEY = get_env('ZENKO_SECRET_KEY')
RING_S3C_ACCESS_KEY = get_env('RING_S3C_ACCESS_KEY')
RING_S3C_SECRET_KEY = get_env('RING_S3C_SECRET_KEY')
RING_S3C_INGESTION_SRC_BUCKET_NAME = get_env('RING_S3C_INGESTION_SRC_BUCKET_NAME')
RING_S3C_ENDPOINT = get_env('RING_S3C_ENDPOINT')
buckets = [
    get_env('AWS_CRR_SRC_BUCKET_NAME', 'zenko-aws-crr-src-bucket'),
    get_env('GCP_CRR_SRC_BUCKET_NAME', 'zenko-gcp-crr-src-bucket'),
    get_env('AZURE_CRR_SRC_BUCKET_NAME', 'zenko-azure-crr-src-bucket'),
    get_env('WASABI_CRR_SRC_BUCKET_NAME', 'zenko-wasabi-crr-src-bucket'),
    get_env('DO_CRR_SRC_BUCKET_NAME', 'zenko-do-crr-src-bucket'),
    get_env('MULTI_CRR_SRC_BUCKET_NAME', 'zenko-multi-crr-src-bucket'),
    get_env('TRANSIENT_SRC_BUCKET_NAME', 'ci-zenko-transient-src-bucket'),
    get_env('CEPH_CRR_SRC_BUCKET_NAME', 'ci-zenko-ceph-crr-src-bucket')
]

if get_env('S3_FUZZER') is not None:
    buckets += [
        'fuzzbucket-ver',
        'fuzzbucket-nonver'
    ]

s = Session(aws_access_key_id=ZENKO_ACCESS_KEY,
            aws_secret_access_key=ZENKO_SECRET_KEY)
s3client = s.resource('s3',
                      endpoint_url=ZENKO_ENDPOINT,
                      verify=VERIFY_CERTIFICATES)

s3c = Session(aws_access_key_id=RING_S3C_ACCESS_KEY,
            aws_secret_access_key=RING_S3C_SECRET_KEY)
ring_s3c_client = s3c.resource('s3', endpoint_url=RING_S3C_ENDPOINT,
                      verify=VERIFY_CERTIFICATES)

# Create buckets

## Creating S3C buckets
_log.info('Creating S3C buckets...')
bucket_safe_create(ring_s3c_client.Bucket(RING_S3C_INGESTION_SRC_BUCKET_NAME))
ring_s3c_client.Bucket(RING_S3C_INGESTION_SRC_BUCKET_NAME).Versioning().enable()

## Creating Zenko buckets
_log.info('Creating testing buckets...')
timeout = time.time() + TIMEOUT
backoff = 1
created = False
while time.time() < timeout:
    try:
        for bucket in buckets:
            bucket_safe_create(s3client.Bucket(bucket))
        created = True
        break
    except Exception:
        _log.warn('Failed to create buckets, backing off and trying again')
        time.sleep(backoff)
        backoff = backoff ** 2

if not created:
    _log.critical('Failed to create buckets and %i secs has elasped!' % TIMEOUT)
    sys.exit(1)
else:
    _log.info('Created buckets')


if get_env('S3_FUZZER') is not None:
    _log.info('Enabling version for s3://fuzzbucket-ver')
    bkt = s3client.Bucket('fuzzbucket-ver').Versioning().enable()

# Wait for all containers to become ready
wait_for_pods(False, TIMEOUT)
