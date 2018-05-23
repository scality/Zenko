import zenko_e2e.util as util
import requests
import zenko_e2e.conf as conf
import pytest

def build_metrics_endpoint(path):
	return conf.BACKBEAT_METRICS_ENDPOINT + path

@pytest.mark.skip(reason ='Not implemented in CI')
def test_backbeat_backlog_metrics():
	for cloud in conf.MULTI_CRR_TARGETS:
		backend = getattr(conf, '%s_CRR_BACKEND')
		resp = requests.get(build_metrics_endpoint('/_/metrics/crr/%s/backlog'%backend))
		assert resp
		assert resp.status_code == 200
		payload = resp.json()
		assert payload
