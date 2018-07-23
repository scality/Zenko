import requests
from requests.auth import HTTPBasicAuth


class GrafanaClient(object):
    def __init__(self, user, password, endpoint):
        self._user = user
        self._password = password
        self._endpoint = endpoint

    def get_datasource(self, datasource):
        resp = requests.get(
            '{}/api/datasources/name/{}'.format(
                self._endpoint, datasource),
            auth=HTTPBasicAuth(self._user, self._password))
        assert resp
        assert resp.status_code == 200
        return resp.json()

    def get_dashboard(self, dashboard):
        resp = requests.get(
            '{}/api/dashboards/db/{}'.format(
                self._endpoint, dashboard),
            auth=HTTPBasicAuth(self._user, self._password))
        assert resp
        assert resp.status_code == 200
        return resp.json()
