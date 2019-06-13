import logging

import pytest
import zenko_e2e.util as util

from ..fixtures import *

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(name)s %(levelname)s: %(message)s',
                    datefmt='%S')


@pytest.mark.skip(reason='test case covered')
@pytest.mark.flaky(reruns=3)
@pytest.mark.parametrize('datafile', [testfile, mpufile])
@pytest.mark.conformance
def test_aws_1_1(aws_crr_bucket, aws_crr_target_bucket, objkey, datafile):
    util.mark_test('AWS 1-1 REPLICATION')
    data = datafile()
    util.upload_object(aws_crr_bucket, objkey, data)
    assert util.check_object(
        objkey, data, aws_crr_bucket, aws_crr_target_bucket, timeout=300)


@pytest.mark.flaky(reruns=3)
@pytest.mark.parametrize('datafile', [testfile, mpufile])
@pytest.mark.conformance
def test_gcp_1_1(gcp_crr_bucket, gcp_crr_target_bucket, objkey, datafile):
    util.mark_test('GCP 1-1 REPLICATION')
    data = datafile()
    util.upload_object(gcp_crr_bucket, objkey, data)
    assert util.check_object(
        objkey, data, gcp_crr_bucket, gcp_crr_target_bucket, timeout=300)


@pytest.mark.skip(reason='test case covered')
@pytest.mark.flaky(reruns=3)
@pytest.mark.parametrize('datafile', [testfile, mpufile])
@pytest.mark.conformance
def test_azure_1_1(
        azure_crr_bucket, azure_crr_target_bucket, objkey, datafile):
    util.mark_test('AZURE 1-1 REPLICATION')
    data = datafile()
    util.upload_object(azure_crr_bucket, objkey, data)
    assert util.check_object(
        objkey, data, azure_crr_bucket, azure_crr_target_bucket, timeout=300)


@pytest.mark.parametrize('datafile', [testfile, mpufile])
@pytest.mark.conformance
def test_ceph_1_1(
        ceph_crr_bucket, ceph_crr_target_bucket, objkey, datafile):
    util.mark_test('CEPH 1-1 REPLICATION')
    data = datafile()
    util.upload_object(ceph_crr_bucket, objkey, data)
    assert util.check_object(
        objkey, data, ceph_crr_bucket, ceph_crr_target_bucket, timeout=300)


@pytest.mark.skip(reason='Wasabi not implemented in CI')
@pytest.mark.parametrize('datafile', [testfile, mpufile])
@pytest.mark.conformance
def test_wasabi_1_1(wasabi_crr_bucket,
                    wasabi_crr_target_bucket, objkey, datafile):
    util.mark_test('WASABI 1-1 REPLICATION')
    data = datafile()
    util.upload_object(wasabi_crr_bucket, objkey, data)
    assert util.check_object(
        objkey,
        testfile,
        wasabi_crr_bucket,
        wasabi_crr_target_bucket,
        timeout=30)


@pytest.mark.flaky(reruns=1)
@pytest.mark.parametrize('datafile', [testfile, mpufile])
@pytest.mark.conformance
def test_multi_1_M(  # pylint: disable=invalid-name, too-many-arguments
        multi_crr_bucket,
        aws_crr_target_bucket,
        gcp_crr_target_bucket,
        azure_crr_target_bucket,
        objkey,
        datafile):
    util.mark_test("MULTI 1-M REPLICATION")
    data = datafile()
    util.upload_object(multi_crr_bucket, objkey, data)
    assert util.check_object(objkey, data,
                             multi_crr_bucket,
                             aws_crr_target_bucket,
                             gcp_crr_target_bucket,
                             azure_crr_target_bucket,
                             timeout=300)
