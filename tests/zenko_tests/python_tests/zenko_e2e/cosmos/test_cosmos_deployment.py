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
    "file1": "b781c1f5179214f6d7f3f957a989a5b9",  # 1KB
    "file2": "e1961ee5d47897950cc57b7c98fd43d2",  # 1MB
    "file3": "7e96ca8de916f4a259ef7b4fcdb49d91",  # 10MB
    "file4": "aa06df7da67c9362335bc2068b3d49c9",  # 100MB
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
@pytest.mark.conformance
def test_cosmos_nfs_ingest(nfs_loc, nfs_loc_bucket, kube_batch, timeout=180):
    util.mark_test('SOFS-NFS INGESTION')
    job_name = INGESTION_JOB.format(nfs_loc)
    _timestamp = time.time()

    while time.time() - _timestamp < timeout:
        try:
            state = kube_batch.read_namespaced_job_status(
                job_name, conf.K8S_NAMESPACE)
            if state.status.succeeded:
                assert state.status.succeeded
                break
        except ApiException as err:
            _log.error("Exception when calling job status %s", err)
        _log.info("Waiting for job completion")
        time.sleep(1)
    else:
        _log.error('Initial ingestion did not complete in time')
    _log.debug("Finished with job status %s", state)
    assert state

    for (key, md5) in MD5_HASHES.items():
        _log.debug("Checking object %s with hash %s", key, md5)
        assert util.get_object_hash(nfs_loc_bucket, key) == md5
