import pytest
from ..fixtures import *
from .. import util


@pytest.mark.skip(reason='test case covered')
@pytest.mark.flaky(reruns=3)
@pytest.mark.conformance
def test_mpu_aws(aws_ep_bucket, aws_target_bucket, mpufile, objkey):
    util.mark_test('AWS MPU UPLOAD')
    aws_ep_bucket.create()
    util.upload_object(aws_ep_bucket, objkey, mpufile)
    util.remark('Done uploading file, downloading and checking hash')
    assert util.check_object(
        objkey, mpufile, aws_ep_bucket, aws_target_bucket, timeout=60)


@pytest.mark.flaky(reruns=3)
@pytest.mark.conformance
def test_mpu_gcp(gcp_ep_bucket, gcp_target_bucket, mpufile, objkey):
    util.mark_test('GCP MPU UPLOAD')
    gcp_ep_bucket.create()
    util.upload_object(gcp_ep_bucket, objkey, mpufile)
    util.remark('Done uploading file, downloading and checking hash')
    assert util.check_object(
        objkey, mpufile, gcp_ep_bucket, gcp_target_bucket, timeout=60)


@pytest.mark.skip(reason='test case covered')
@pytest.mark.flaky(reruns=3)
@pytest.mark.conformance
def test_mpu_azure(azure_ep_bucket, azure_target_bucket, mpufile, objkey):
    util.mark_test('AZURE MPU UPLOAD')
    azure_ep_bucket.create()
    util.upload_object(azure_ep_bucket, objkey, mpufile)
    util.remark('Done uploading file, downloading and checking hash')
    assert util.check_object(
        objkey, mpufile, azure_ep_bucket, azure_target_bucket, timeout=60)


@pytest.mark.conformance
def test_mpu_ceph(ceph_ep_bucket, ceph_target_bucket, mpufile, objkey):
    util.mark_test('CEPH MPU UPLOAD')
    ceph_ep_bucket.create()
    util.upload_object(ceph_ep_bucket, objkey, mpufile)
    util.remark('Done uploading file, downloading and checking hash')
    assert util.check_object(
        objkey, mpufile, ceph_ep_bucket, ceph_target_bucket, timeout=60)


@pytest.mark.skip(reason='Wasabi not implemented in CI')
@pytest.mark.conformance
def test_mpu_wasabi(wasabi_ep_bucket, wasabi_target_bucket, mpufile, objkey):
    util.mark_test('WASABI MPU UPLOAD')
    wasabi_ep_bucket.create()
    util.upload_object(wasabi_ep_bucket, objkey, mpufile)
    util.remark('Done uploading file, downloading and checking hash')
    assert util.check_object(
        objkey, mpufile, wasabi_ep_bucket, wasabi_target_bucket)


@pytest.mark.skip(
    reason='Digital Ocean Spaces is super flakey causing this test to fail')
@pytest.mark.conformance
def test_mpu_digital_ocean(digital_ocean_ep_bucket,
                           digital_ocean_target_bucket, mpufile, objkey):
    util.mark_test('DIGITAL OCEAN MPU UPLOAD')
    digital_ocean_ep_bucket.create()
    util.upload_object(digital_ocean_ep_bucket, objkey, mpufile)
    util.remark('Done uploading file, downloading and checking hash')
    assert util.check_object(
        objkey, mpufile, digital_ocean_ep_bucket, digital_ocean_target_bucket)
