import pytest
import zenko_e2e.conf as conf
import zenko_e2e.util as util
import logging
import time
from ..fixtures import *

logging.basicConfig(level = logging.INFO,
				format =  '%(asctime)s %(name)s %(levelname)s: %(message)s',
				datefmt = '%S')

@pytest.mark.skip(reason ='Test not behaving properly')
@pytest.mark.conformance
def test_aws_1_1(aws_crr_bucket, aws_crr_target_bucket, testfile, objkey):
	util.mark_test('AWS 1-1 REPLICATION')
	aws_crr_bucket.put_object(
		Body = testfile,
		Key = objkey
	)

	time.sleep(60)
	print(aws_crr_bucket.name)
	assert util.check_object(objkey, testfile, aws_crr_bucket, aws_crr_target_bucket, timeout = 30)

@pytest.mark.skip(reason ='Test not behaving properly')
@pytest.mark.conformance
def test_gcp_1_1(gcp_crr_bucket, gcp_crr_target_bucket, testfile, objkey):
	util.mark_test('GCP 1-1 REPLICATION')
	gcp_crr_bucket.put_object(
		Body = testfile,
		Key = objkey
	)

	time.sleep(60)
	assert util.check_object(objkey, testfile, gcp_crr_bucket, gcp_crr_target_bucket, timeout = 30)

@pytest.mark.skip(reason ='Test not behaving properly')
@pytest.mark.conformance
def test_azure_1_1(azure_crr_bucket, azure_crr_target_bucket, testfile, objkey):
	util.mark_test('AZURE 1-1 REPLICATION')
	azure_crr_bucket.put_object(
		Body = testfile,
		Key = objkey
	)

	time.sleep(60)
	assert util.check_object(objkey, testfile, azure_crr_bucket, azure_crr_target_bucket, timeout = 30)

@pytest.mark.skip(reason ='Wasabi not implemented in CI')
@pytest.mark.conformance
def test_wasabi_1_1(wasabi_crr_bucket, wasabi_crr_target_bucket, testfile, objkey):
	util.mark_test('AZURE 1-1 REPLICATION')
	wasabi_crr_bucket.put_object(
		Body = testfile,
		Key = objkey
	)
	assert util.check_object(objkey, testfile, wasabi_crr_bucket, wasabi_crr_target_bucket, timeout = 30)

@pytest.mark.skip(reason ='Not implemented in CI')
@pytest.mark.conformance
def test_multi_1_M(multi_crr_bucket, aws_crr_target_bucket, gcp_crr_target_bucket, azure_crr_target_bucket, testfile, objkey):
	util.mark_test("MULTI 1-M REPLICATION")
	multi_crr_bucket.put_object(
		Body = testfile,
		Key = objkey
	)
	assert util.check_object(objkey, testfile,
		multi_crr_bucket,
		aws_crr_target_bucket,
		gcp_crr_target_bucket,
		azure_crr_target_bucket,
		timeout = 30)
