import pytest
import zenko_e2e.util as util

from ..fixtures import *


@pytest.mark.conformance
def test_ring_storage(zenko_bucket, testfile, objkey):
    util.mark_test('RING STORAGE DEFAULT EP LOCATION')
    zenko_bucket.create()
    zenko_bucket.put_object(
        Body=testfile,
        Key=objkey
    )
    assert util.check_object(objkey, testfile, zenko_bucket)


@pytest.mark.conformance
def test_aws_storage(aws_ep_bucket, aws_target_bucket, testfile, objkey):
    util.mark_test('AWS STORAGE DEFAULT EP LOCATION')
    aws_ep_bucket.create()
    aws_ep_bucket.put_object(
        Body=testfile,
        Key=objkey
    )
    assert util.check_object(
        objkey, testfile, aws_ep_bucket, aws_target_bucket)


@pytest.mark.conformance
def test_gcp_storage(gcp_ep_bucket, gcp_target_bucket, testfile, objkey):
    util.mark_test('GCP STORAGE DEFAULT EP LOCATION')
    gcp_ep_bucket.create()
    gcp_ep_bucket.put_object(
        Body=testfile,
        Key=objkey
    )
    assert util.check_object(
        objkey, testfile, gcp_ep_bucket, gcp_target_bucket)


@pytest.mark.conformance
def test_azure_storage(azure_ep_bucket, azure_target_bucket, testfile, objkey):
    util.mark_test('AZURE STORAGE DEFAULT EP LOCATION')
    azure_ep_bucket.create()
    azure_ep_bucket.put_object(
        Body=testfile,
        Key=objkey
    )
    assert util.check_object(
        objkey, testfile, azure_ep_bucket, azure_target_bucket)


@pytest.mark.conformance
def test_ceph_storage(ceph_ep_bucket, ceph_target_bucket, testfile, objkey):
    util.mark_test('CEPH STORAGE DEFAULT EP LOCATION')
    ceph_ep_bucket.create()
    ceph_ep_bucket.put_object(
        Body=testfile,
        Key=objkey
    )
    assert util.check_object(
        objkey, testfile, ceph_ep_bucket, ceph_target_bucket)


@pytest.mark.skip(reason='Wasabi Not implemented in CI')
@pytest.mark.conformance
def test_wasabi_storage(
        wasabi_ep_bucket, wasabi_target_bucket, testfile, objkey):
    util.mark_test('WASABI STORAGE DEFAULT EP LOCATION')
    wasabi_ep_bucket.create()
    wasabi_ep_bucket.put_object(
        Body=testfile,
        Key=objkey
    )
    assert util.check_object(
        objkey, testfile, wasabi_ep_bucket, wasabi_target_bucket)


@pytest.mark.skip(
    reason='Digital Ocean Spaces is super flakey causing this test to fail')
@pytest.mark.conformance
def test_digital_ocean_storage(
        digital_ocean_ep_bucket,
        digital_ocean_target_bucket,
        testfile,
        objkey):
    util.mark_test('DIGITAL OCEAN STORAGE DEFAULT EP LOCATION')
    digital_ocean_ep_bucket.create()
    digital_ocean_ep_bucket.put_object(
        Body=testfile,
        Key=objkey
    )
    assert util.check_object(
        objkey, testfile, digital_ocean_ep_bucket, digital_ocean_target_bucket)
