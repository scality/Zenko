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
    "file5": "465e3cc6ea85a2503de80459ad0b8634",  # 1GB
}


INGESTION_JOB = '{}-cosmos-rclone-initial-ingest'


@pytest.fixture
def kube():
    return client.ApiClient(config.load_incluster_config())


@pytest.fixture
def kube_batch(kube):
    return client.BatchV1Api(kube)


# Timeout has been increased to 180 because of setup time but really shouldn't
# be increased any further. Please investigate possible regressions or test
# refactor before increasing the timeout any further.
@pytest.fixture
def wait_for_job(kube_batch, job_name, timeout=180):
    _timestamp = time.time()
    while time.time() - _timestamp < timeout:
        try:
            state = kube_batch.read_namespaced_job_status(
                job_name, conf.K8S_NAMESPACE)
            if state.status.succeeded:
                _log.debug("Finished with job status %s", state)
                break
        except ApiException as err:
            _log.error("Exception when calling job status %s", err)
        _log.info("Waiting for job completion")
        time.sleep(1)
    else:
        _log.error('Initial ingestion did not complete in time')
    return state


@pytest.mark.conformance
def test_cosmos_nfs_ingest(nfs_loc, nfs_loc_bucket, kube_batch):
    util.mark_test('SOFS-NFS OOB INGESTION')
    job_name = INGESTION_JOB.format(nfs_loc)
    assert wait_for_job(kube_batch, job_name)

    for (key, md5) in MD5_HASHES.items():
        _log.debug("Checking object %s with hash %s", key, md5)
        assert util.get_object_hash(nfs_loc_bucket, key) == md5


@pytest.mark.conformance
def test_cosmos_aws_ingest(aws_target_bucket, zenko_bucket, kube_batch, testfile, objkey): # noqa pylint: disable=dangerous-default-value,too-many-arguments
    util.mark_test('AWS OOB INGESTION')
    aws_target_bucket.put_object(
        Body=testfile,
        Key=objkey,
    )
    zenko_bucket = aws_loc_bucket(zenko_bucket, ingest=True)
    job_name = INGESTION_JOB.format(conf.AWS_BACKEND)
    assert wait_for_job(kube_batch, job_name)
    assert util.check_object(
        objkey, testfile, zenko_bucket, aws_target_bucket)


@pytest.mark.conformance
def test_cosmos_ceph_ingest(ceph_target_bucket, zenko_bucket, kube_batch, testfile, objkey): # noqa pylint: disable=dangerous-default-value,too-many-arguments
    util.mark_test('CEPH OOB INGESTION')
    ceph_target_bucket.put_object(
        Body=testfile,
        Key=objkey,
    )
    zenko_bucket = ceph_loc_bucket(zenko_bucket, ingest=True)
    job_name = INGESTION_JOB.format(conf.CEPH_BACKEND)
    assert wait_for_job(kube_batch, job_name)
    assert util.check_object(
        objkey, testfile, zenko_bucket, ceph_target_bucket)
