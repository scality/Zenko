import time

import requests
from requests.auth import HTTPBasicAuth


class GrafanaClient(object):
    def __init__(self, user, password, endpoint):
        self._user = user
        self._password = password
        self._endpoint = endpoint

    def _get(self, path):
        backoff = 2
        for _ in range(4):  # One try with 3 retries
            try:
                resp = requests.get(
                    path,
                    auth=HTTPBasicAuth(self._user, self._password)
                )
                assert resp
                assert resp.status_code == 200
                assert resp.json()
                return True
            except Exception:  # pylint: disable=broad-except
                pass
            time.sleep(backoff)
            backoff *= 2
        return False

    def get_datasource(self, datasource):
        return self._get(
            '{}/api/datasources/name/{}'.format(
                self._endpoint,
                datasource
            ),
        )

    def get_dashboard(self, dashboard):
        return self._get(
            '{}/api/dashboards/db/{}'.format(
                self._endpoint,
                dashboard
            )
        )
