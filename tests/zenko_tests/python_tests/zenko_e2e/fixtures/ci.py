import os.path
import pytest
import zenko_e2e.prometheus.client
import zenko_e2e.conf as conf


@pytest.fixture(scope='session')
def prometheus_client():
    '''A Prometheus client for the Prometheus server deployed with Zenko'''

    url = os.getenv('PROMETHEUS_ENDPOINT')
    if not url:
        url = 'http://{}-prometheus-server:80'.format(conf.ZENKO_HELM_RELEASE)

    return zenko_e2e.prometheus.client.PrometheusClient(prometheus_url=url)


@pytest.fixture
def namespace():
    return conf.K8S_NAMESPACE
