import logging
import time
import pytest
import zenko_e2e.conf as conf
from kubernetes import client, config
from kubernetes.client.rest import ApiException
from ..fixtures import *
from .. import util

_log = logging.getLogger('cosmos')  # pylint: disable=invalid-name

MD5_HASHES = {
    "file1": "e61d15de7ad98164bad4394b818510a9",  # 1KB
    "file2": "18bcf93f4a001b4cdfc3fc702847864f",  # 1MB
    "file3": "b4bf46b4640547ab96e75b24170242c1",  # 10MB
    "file4": "1baecec7b7c658357288ac736b6e95a6",  # 100MB
}


INGESTION_POD = '{}-cosmos-rclone-initial-ingest'


@pytest.fixture
def kube():
    return client.ApiClient(config.load_incluster_config())


@pytest.fixture
def kube_batch(kube):
    return client.BatchV1Api(kube)


@pytest.fixture
def kube_corev1(kube):
    return client.CoreV1Api(kube)


@pytest.fixture
def compare_versions(objkey, aws_target_bucket, zenko_bucket):
    src_obj = aws_target_bucket.Object(objkey)
    dst_obj = zenko_bucket.Object(objkey)
    if src_obj.version_id != dst_obj.metadata['version-id']:
        return False
    src_hash = util.get_object_hash(aws_target_bucket, objkey)
    zenko_bucket.put_object(Key=objkey)
    dst_hash = util.get_object_hash(
        zenko_bucket, objkey, versionid=dst_obj.version_id)
    if src_hash != dst_hash:
        return False
    return True


# Timeout has been increased to 180 because of setup time but really shouldn't
# be increased any further. Please investigate possible regressions or test
# refactor before increasing the timeout any further.
@pytest.fixture
def wait_for_pod(kube_corev1, pod_name, timeout=180):
    _timestamp = time.time()
    while time.time() - _timestamp < timeout:
        try:
            pod = kube_corev1.read_namespaced_pod(
                pod_name, conf.K8S_NAMESPACE)
            if pod.status.phase == 'Succeeded':
                _log.debug("Finished with pod status %s", pod.status.phase)
                break
        except ApiException as err:
            _log.error("Exception when calling pod status %s", err)
        _log.info("Waiting for pod completion")
        time.sleep(1)
    else:
        _log.error('Initial ingestion did not complete in time')
    return pod.status.phase


@pytest.mark.conformance
def test_cosmos_nfs_ingest(nfs_loc, nfs_loc_bucket, kube_corev1):
    util.mark_test('SOFS-NFS OOB INGESTION')
    pod_name = INGESTION_POD.format(nfs_loc)
    assert wait_for_pod(kube_corev1, pod_name) == 'Succeeded'

    for (key, md5) in MD5_HASHES.items():
        _log.debug("Checking object %s with hash %s", key, md5)
        assert util.get_object_hash(nfs_loc_bucket, key) == md5


@pytest.mark.conformance
def test_cosmos_aws_ingest(aws_target_bucket, zenko_bucket, kube_corev1, testfile, objkey): # noqa pylint: disable=dangerous-default-value,too-many-arguments
    util.mark_test('AWS OOB INGESTION')
    aws_target_bucket.put_object(
        Body=testfile,
        Key=objkey,
    )
    zenko_bucket = aws_loc_bucket(zenko_bucket, ingest=True)
    pod_name = INGESTION_POD.format(conf.AWS_BACKEND)
    # Wait for initial ingestion
    assert wait_for_pod(kube_corev1, pod_name) == 'Succeeded'
    # Validate ingestion
    assert util.check_object(
        objkey, testfile, zenko_bucket, aws_target_bucket)
    # Validate versioning
    assert compare_versions(objkey, aws_target_bucket, zenko_bucket)


@pytest.mark.conformance
def test_cosmos_ceph_ingest(ceph_target_bucket, zenko_bucket, kube_corev1, testfile, objkey): # noqa pylint: disable=dangerous-default-value,too-many-arguments
    util.mark_test('CEPH OOB INGESTION')
    ceph_target_bucket.put_object(
        Body=testfile,
        Key=objkey,
    )
    zenko_bucket = ceph_loc_bucket(zenko_bucket, ingest=True)
    pod_name = INGESTION_POD.format(conf.CEPH_BACKEND)
    assert wait_for_pod(kube_corev1, pod_name) == 'Succeeded'
    assert util.check_object(
        objkey, testfile, zenko_bucket, ceph_target_bucket)
    assert compare_versions(objkey, ceph_target_bucket, zenko_bucket)
