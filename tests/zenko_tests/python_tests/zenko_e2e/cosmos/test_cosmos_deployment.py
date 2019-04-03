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


INGESSTION_SUFFIX = '-cosmos-rclone-initial-ingest'


@pytest.fixture
def kube():
    return client.ApiClient(config.load_incluster_config())


@pytest.fixture
def kube_batch(kube):
    return client.BatchV1Api(kube)


@pytest.mark.conformance
def test_check_job_completion(nfs_loc, nfs_loc_bucket, kube_batch, timeout=60):
    job_name = nfs_loc + INGESSTION_SUFFIX
    namespace = conf.K8S_NAMESPACE
    _timestamp = time.time()

    while True:
        if time.time() - _timestamp > timeout:
            _log.error('Initial ingestion did not complete in time')
            break
        try:
            state = kube_batch.read_namespaced_job_status(job_name, namespace)
        except ApiException as err:
            _log.error("Exception when calling job status %s", err)
        _log.info("Waiting for job completion")
        time.sleep(1)
    _log.debug("Finished with job status %s", state.status)
    assert state.status.succeeded

    for (key, md5) in MD5_HASHES.items():
        _log.debug("Checking object %s with hash %s", key, md5)
        assert util.get_object_hash(nfs_loc_bucket, key) == md5
