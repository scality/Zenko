import zenko_e2e.conf as conf
from ..fixtures import *
import logging

@pytest.mark.conformance
def test_mpu_aws(aws_ep_bucket, aws_target_bucket, mpufile, objkey):
	util.mark_test('AWS MPU UPLOAD')
	aws_ep_bucket.create('zenko-aws-mpu-bucket')
	aws_ep_bucket.put_object(
		Body = mpufile,
		Key = objkey
	)
	util.remark('Done uploading file, downloading and checking hash')
	assert util.check_object(objkey, mpufile, aws_ep_bucket, aws_target_bucket)

@pytest.mark.conformance
def test_mpu_gcp(gcp_ep_bucket, gcp_target_bucket, mpufile, objkey):
	util.mark_test('GCP MPU UPLOAD')
	gcp_ep_bucket.create('zenko-gcp-mpu-bucket')
	gcp_ep_bucket.put_object(
		Body = mpufile,
		Key = objkey
	)
	util.remark('Done uploading file, downloading and checking hash')
	assert util.check_object(objkey, mpufile, gcp_ep_bucket, gcp_target_bucket)

# @pytest.mark.skip()
@pytest.mark.conformance
def test_mpu_azure(azure_ep_bucket, azure_target_bucket, mpufile, objkey):
	util.mark_test('AZURE MPU UPLOAD')
	azure_ep_bucket.create('zenko-azure-mpu-bucket')
	azure_ep_bucket.put_object(
		Body = mpufile,
		Key = objkey
	)
	util.remark('Done uploading file, downloading and checking hash')
	assert util.check_object(objkey, mpufile, azure_ep_bucket, azure_target_bucket)

@pytest.mark.skip(reason ='Wasabi not implemented in CI')
@pytest.mark.conformance
def test_mpu_wasabi(wasabi_ep_bucket, wasabi_target_bucket, mpufile, objkey):
	util.mark_test('WASABI MPU UPLOAD')
	wasabi_ep_bucket.create()
	wasabi_ep_bucket.put_object(
		Body = mpufile,
		Key = objkey
	)
	util.remark('Done uploading file, downloading and checking hash')
	assert util.check_object(objkey, mpufile, wasabi_ep_bucket, wasabi_target_bucket)

@pytest.mark.skip(reason = 'Digital Ocean Spaces is super flakey causing this test to fail')
@pytest.mark.conformance
def test_mpu_digital_ocean(digital_ocean_ep_bucket, digital_ocean_target_bucket, mpufile, objkey):
	util.mark_test('DIGITAL OCEAN MPU UPLOAD')
	digital_ocean_ep_bucket.create()
	digital_ocean_ep_bucket.put_object(
		Body = mpufile,
		Key = objkey
	)
	util.remark('Done uploading file, downloading and checking hash')
	assert uitl.check_object(objkey, mpufile, digital_ocean_ep_bucket, digital_ocean_target_bucket)
