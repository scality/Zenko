#!/usr/bin/env python
from boto3 import Session
from kubernetes import client, config
import time
import sys
import os


def get_env(key, default=None, error=False):
    if not error:
        return os.environ.get(key, default)
    return os.environ[key]


def bucket_safe_create(bucket):
    try:
        bucket.create()
    except bucket.meta.client.exceptions.BucketAlreadyOwnedByYou:
        print('Bucket %s already exists!' % bucket.name)
    except Exception as exp:  # pylint: disable=broad-except
        print('Error creating bucket %s - %s' % (bucket.name, str(exp)))
        raise exp


TIMEOUT = 120  # 2 Minutes

K8S_NAMESPACE = os.getenv('ZENKO_K8S_NAMESPACE')
ZENKO_HELM_RELEASE = os.getenv('ZENKO_HELM_RELEASE')
ZENKO_ENDPOINT = get_env('CLOUDSERVER_FRONT_ENDPOINT',
                         'http://%s-cloudserver-front:80' % ZENKO_HELM_RELEASE)
VERIFY_CERTIFICATES = get_env('VERIFY_CERTIFICATES', False)

ZENKO_ACCESS_KEY = get_env('ZENKO_ACCESS_KEY')
ZENKO_SECRET_KEY = get_env('ZENKO_SECRET_KEY')

buckets = [
    get_env('AWS_S3_BACKBEAT_SRC_BUCKET_NAME', 'zenko-aws-crr-src-bucket'),
    get_env('GCP_CRR_SRC_BUCKET_NAME', 'zenko-gcp-crr-src-bucket'),
    get_env('AZURE_BACKBEAT_SRC_CONTAINER_NAME', 'zenko-azure-crr-src-bucket'),
    get_env('WASABI_CRR_SRC_BUCKET', 'zenko-wasabi-crr-src-bucket'),
    get_env('DO_CRR_SRC_BUCKET', 'zenko-do-crr-src-bucket'),
    get_env('MULTI_CRR_SRC_BUCKET', 'zenko-multi-crr-src-bucket')
]

s = Session(aws_access_key_id=ZENKO_ACCESS_KEY,
            aws_secret_access_key=ZENKO_SECRET_KEY)
s3client = s.resource('s3',
                      endpoint_url=ZENKO_ENDPOINT,
                      verify=VERIFY_CERTIFICATES)

print('Creating testing buckets...')
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
        print('Failed to create buckets, backing off and trying again')
        time.sleep(backoff)
        backoff = backoff ** 2

if not created:
    print('Failed to create buckets and %i secs has elasped!' % TIMEOUT)
    sys.exit(1)
else:
    print('Created buckets')
# Wait for all containers to become ready
config.load_incluster_config()

v1 = client.CoreV1Api()

timeout = time.time() + TIMEOUT
while time.time() < timeout:
    ret = v1.list_namespaced_pod(K8S_NAMESPACE)
    passed = True
    for i in ret.items:
        for container in i.status.container_statuses:
            if not container.ready:
                print('%s is not ready' % container.name)
                passed = False
                break
        if not passed:
            break
    if not passed:
        time.sleep(1)
    else:
        break

if not passed:
    print('Containers have not become ready and TIMEOUT has elasped')
    sys.exit(1)
