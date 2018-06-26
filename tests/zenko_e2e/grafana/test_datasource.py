import pytest


GRAFANA_DATASOURCES = [
    'Prometheus',
]


@pytest.mark.nondestructive
@pytest.mark.parametrize('datasource', GRAFANA_DATASOURCES)
def test_datasource(grafana_client, datasource):
    assert grafana_client.get_datasource(datasource)
