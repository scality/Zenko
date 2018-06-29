import pytest
import zenko_e2e.util as util
import logging
from ..fixtures import *

logging.basicConfig(level = logging.INFO,
				format =  '%(asctime)s %(name)s %(levelname)s: %(message)s',
				datefmt = '%S')

@pytest.mark.conformance
def test_aws_storage(aws_loc_bucket, aws_target_bucket, testfile, objkey):
	util.mark_test('AWS STORAGE LOCATION CONSTRAINT')
	aws_loc_bucket.put_object(
		Body = testfile,
		Key = objkey
	)
	assert util.check_object(objkey, testfile, aws_loc_bucket, aws_target_bucket)

@pytest.mark.conformance
def test_gcp_storage(gcp_loc_bucket, gcp_target_bucket, testfile, objkey):
	util.mark_test('GCP STORAGE LOCATION CONSTRAINT')
	gcp_loc_bucket.put_object(
		Body = testfile,
		Key = objkey
	)
	assert util.check_object(objkey, testfile, gcp_loc_bucket, gcp_target_bucket)

@pytest.mark.conformance
def test_azure_storage(azure_loc_bucket, azure_target_bucket, testfile, objkey):
	util.mark_test('AZURE STORAGE LOCATION CONSTRAINT')
	azure_loc_bucket.put_object(
		Body = testfile,
		Key = objkey
	)
	assert util.check_object(objkey, testfile, azure_loc_bucket, azure_target_bucket)

@pytest.mark.skip(reason ='Wasabi Not implemented in CI')
@pytest.mark.conformance
def test_wasabi_storage(wasabi_loc_bucket, wasabi_target_bucket, testfile, objkey):
	util.mark_test('WASABI STORAGE LOCATION CONSTRAINT')
	wasabi_loc_bucket.put_object(
		Body = testfile,
		Key = objkey
	)
	assert util.check_object(objkey, testfile, wasabi_loc_bucket, wasabi_target_bucket)

@pytest.mark.skip(reason = 'Digital Ocean Spaces is super flakey causing this test to fail')
@pytest.mark.conformance
def test_digital_ocean_storage(digital_ocean_loc_bucket, digital_ocean_target_bucket, testfile, objkey):
	util.mark_test('DIGITAL OCEAN STORAGE LOCATION CONSTRAINT')
	digital_ocean_loc_bucket.put_object(
		Body = testfile,
		Key = objkey
	)
	assert uitl.check_object(objkey, testfile, digital_ocean_loc_bucket, digital_ocean_target_bucket)
