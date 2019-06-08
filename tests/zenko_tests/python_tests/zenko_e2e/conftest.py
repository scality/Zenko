# flake8: noqa
# pylint: disable=wrong-import-position
import logging
import os
import os.path

class Blacklist(logging.Filter):  # noqa pylint: disable=too-few-public-methods
    def __init__(self, *blacklist): # pylint: disable=super-init-not-called
        self.blacklist = [logging.Filter(name) for name in blacklist]

    def filter(self, record):
        return not any(f.filter(record) for f in self.blacklist)


BLACKLIST = [
    'botocore.vendored.requests.packages.urllib3.connectionpool',
    'azure.storage.common.storageclient'
]

for handler in logging.root.handlers:
    handler.addFilter(Blacklist(*BLACKLIST))

# NOTE These are import here to allow us to install the logging filters above
import boto3
import pytest

import zenko_e2e.prometheus.client
import zenko_e2e.grafana.client

SERVICEACCOUNT_PATH = '/var/run/secrets/kubernetes.io/serviceaccount'


@pytest.fixture(scope='session')
def k8s_namespace():
    '''Kubernetes namespace in which we run'''
    nsenv = os.getenv('ZENKO_K8S_NAMESPACE')
    if nsenv:
        return nsenv

    try:
        with open(os.path.join(SERVICEACCOUNT_PATH, 'namespace'), 'r') as nsfd:
            return nsfd.read()
    except IOError:
        pass

    raise RuntimeError('Unable to determine Zenko K8s namespace')


@pytest.fixture(scope='session')
def zenko_helm_release():
    '''Zenko Helm release name'''
    rel = os.getenv('ZENKO_HELM_RELEASE')
    if not rel:
        raise RuntimeError('Unable to determine Zenko Helm release name')

    return rel


@pytest.fixture
def zenko_s3_client():
    '''A Boto s3 client to the Zenko under test'''

    url = os.getenv('CLOUDSERVER_FRONT_ENDPOINT')
    if not url:
        url = 'http://{}-cloudserver:80'.format(zenko_helm_release())

    return boto3.client(
        service_name='s3',
        endpoint_url=url,
    )


@pytest.fixture(scope='session')
def prometheus_client():
    '''A Prometheus client for the Prometheus server deployed with Zenko'''

    url = os.getenv('PROMETHEUS_ENDPOINT')
    if not url:
        url = 'http://{}-prometheus-server:80'.format(zenko_helm_release())

    return zenko_e2e.prometheus.client.PrometheusClient(prometheus_url=url)


@pytest.fixture(scope='session')
def grafana_client():
    '''A Grafana client for the Grafana server deployed with Zenko'''

    user = os.getenv('GRAFANA_USER')
    if not user:
        user = 'admin'
    password = os.getenv('GRAFANA_PASSWORD')
    if not password:
        password = 'strongpassword'
    url = os.getenv('GRAFANA_ENDPOINT')
    if not url:
        url = 'http://{}-grafana:80'.format(zenko_helm_release())

    return zenko_e2e.grafana.client.GrafanaClient(
        user=user, password=password, endpoint=url)
