import pytest
from zenko_e2e.conftest import zenko_helm_release


@pytest.mark.nondestructive
@pytest.mark.conformance
def test_prometheus_healthy(prometheus_client):
    resp = prometheus_client.get_admin('healthy')
    assert resp.status_code == 200


SERVICE = 'kubernetes-service-endpoints'
POD = 'kubernetes-pods'


@pytest.mark.nondestructive
@pytest.mark.conformance
@pytest.mark.parametrize('job,name', [
    (SERVICE, '{}-cloudserver'.format(zenko_helm_release())),
    (POD, '{}-zenko-queue-0'.format(zenko_helm_release())),
])
def test_prometheus_targets(prometheus_client, k8s_namespace,
                            zenko_helm_release, job, name):
    targets = prometheus_client.get_targets()

    active_targets = targets['activeTargets']
    in_namespace = (
        target for target in active_targets
        if target['labels'].get('kubernetes_namespace') == k8s_namespace)
    this_release = (
        target for target in in_namespace
        if target['labels'].get('release') == zenko_helm_release)
    expected_job = (
        target for target in this_release
        if target['labels'].get('job') == job)

    if job == SERVICE:
        results = (
            target for target in expected_job
            if target['labels'].get('kubernetes_name') == name)
    elif job == POD:
        results = (
            target for target in expected_job
            if target['labels'].get('kubernetes_pod_name') == name)
    else:
        raise ValueError('Unknown value for `job`: {}'.format(job))

    results = list(results)

    assert results != []
    assert all(result['health'] == 'up' for result in results)
