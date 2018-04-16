import operator

import requests


class PrometheusClient(object):
    prometheus_url = property(operator.attrgetter('_prometheus_url'))

    def __init__(self, prometheus_url):
        self._prometheus_url = prometheus_url

    def __repr__(self):
        return 'PrometheusClient(prometheus_url={!r})'.format(
            self.prometheus_url)

    def get_admin(self, name):
        url = '{}/-/{}'.format(self.prometheus_url, name)
        return requests.get(url)

    def get_targets(self):
        resp = requests.get('{}/api/v1/targets'.format(self.prometheus_url))
        assert resp.status_code == 200
        body = resp.json()
        assert body['status'] == 'success'

        return body['data']
