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
    "file1": "e61d15de7ad98164bad4394b818510a9",
    "file2": "18bcf93f4a001b4cdfc3fc702847864f",
    "file3": "b4bf46b4640547ab96e75b24170242c1",
    "file4": "1baecec7b7c658357288ac736b6e95a6",
    "file5": "465e3cc6ea85a2503de80459ad0b8634",
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
    _log.info("Finished with job status %s", state)
    assert state

    for (key, md5) in MD5_HASHES.items():
        _log.info("Checking object %s with hash %s", key, md5)
        assert util.get_object_hash(nfs_loc_bucket, key) == md5
