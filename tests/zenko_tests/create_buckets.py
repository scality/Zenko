#!/usr/bin/env python
from boto3 import Session
from kubernetes import client, config
import time
import sys
import os
import logging
import re
import socket

IGNORED_PODS = [
    r'.+bootstrap',
    'failed',
    'pending',
    'kafkaclient',
    'utils',
]

IGNORED_PODS = [re.compile(x) for x in IGNORED_PODS]

FAIL_STATUS = [
    'CrashLoopBackOff',
    'Error',
]

PASSING_COUNT = 10

def is_ignored(name):
    for ignored in IGNORED_PODS:
        if ignored.search(name):
            return True
    return False


logging.basicConfig(level=logging.INFO)
_log = logging.getLogger('create_buckets')

def check_port(host, port):
    check = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        check.connect_ex((host, port))
        check.close()
        return True
    except:
        check.close()
        return False

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

def wait_for_services(services, timeout):
    timeout = time.time() + timeout
    for service, port in services.items():
        while time.time() < timeout and not check_port(service, port):
            time.sleep(10)
        if time.time() >= timeout:
            _log.critical('Pod %s failed to stabilize' % service)
            sys.exit(1)

def wait_for_pods(delete, timeout):
    _log.info('Waiting for Zenko services to stabilize')
    config.load_incluster_config()
    v1 = client.CoreV1Api()
    delete_opt = client.V1DeleteOptions()

    passed_count = 0
    timed_out = time.time() + timeout
    while time.time() < timed_out:
        ret = v1.list_namespaced_pod(K8S_NAMESPACE)
        passed = True
        for i in ret.items:
            if i.status.container_statuses:
                for container in i.status.container_statuses:
                    if container.ready or is_ignored(container.name):
                        continue
                    elif container.state.waiting:
                        if delete and container.state.waiting.reason in FAIL_STATUS:
                            _log.info('%s is in %s, restarting' % (container.name, container.state.waiting.reason))
                            v1.delete_namespaced_pod(i.metadata.name, K8S_NAMESPACE, body=delete_opt, grace_period_seconds=0)
                        passed = False
                        passed_count = 0
        if passed:
            if passed_count >= PASSING_COUNT:
                break
            passed_count = passed_count + 1
        time.sleep(1)

    if not passed:
      _log.info('Containers have not become ready and %d has elasped' % timeout)
      sys.exit(1)
    else:
      _log.info('Zenko services have stabilized successfully')

TIMEOUT = int(get_env('INSTALL_TIMEOUT'))

K8S_NAMESPACE = os.getenv('HELM_NAMESPACE')
ZENKO_HELM_RELEASE = get_env('ZENKO_HELM_RELEASE', 'zenko-test')
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
# Wait for stateful services to stabilize
redis_host = "%s-redis-ha-server-2.%s-redis-ha.%s.svc.cluster.local" % (
    ZENKO_HELM_RELEASE,
    ZENKO_HELM_RELEASE,
    K8S_NAMESPACE)
mongo_host = "%s-mongodb-replicaset-2.%s-mongodb-replicaset.%s.svc.cluster.local" % (
    ZENKO_HELM_RELEASE,
    ZENKO_HELM_RELEASE,
    K8S_NAMESPACE)
quorum_host = "%s-zenko-quorum-2.%s-zenko-quorum-headless.%s.svc.cluster.local" % (
    ZENKO_HELM_RELEASE,
    ZENKO_HELM_RELEASE,
    K8S_NAMESPACE)
queue_host = "%s-zenko-queue-2.%s-zenko-queue-headless.%s.svc.cluster.local" % (
    ZENKO_HELM_RELEASE,
    ZENKO_HELM_RELEASE,
    K8S_NAMESPACE)
# These services are in the data path and should be stabilized before attempting
# any bucket creation
critical_services = {
    redis_host: 6379,
    mongo_host: 27017,
}
# These services are core to the entire functionality of Zenko and should be
# stabilized prior to waiting for the remaining pods
core_services = {
    redis_host: 6379,
    mongo_host: 27017,
    quorum_host: 2181,
    queue_host: 9092,
}
# Should wait for MongoDB and Redis prior to bucket creation
_log.info('Waiting for MongoDB and Redis')
wait_for_services(critical_services, TIMEOUT)

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
    _log.critical('Failed to create buckets and %i secs has elapsed!' % TIMEOUT)
    sys.exit(1)
else:
    _log.info('Created buckets')

if get_env('S3_FUZZER') is not None:
    _log.info('Enabling version for s3://fuzzbucket-ver')
    bkt = s3client.Bucket('fuzzbucket-ver').Versioning().enable()

# Pods wont stabilize until all the statefulsets are first stable
_log.info('Waiting for statefulsets to be available')
wait_for_services(core_services, TIMEOUT)

# Wait for all containers to become ready
wait_for_pods(False, TIMEOUT)
