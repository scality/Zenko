import pytest


GRAFANA_DASHBOARDS = [
    'cloudserver',
    'backbeat',
]


@pytest.mark.nondestructive
@pytest.mark.parametrize('dashboard', GRAFANA_DASHBOARDS)
def test_dashboard(grafana_client, dashboard):
    assert grafana_client.get_dashboard(dashboard)
