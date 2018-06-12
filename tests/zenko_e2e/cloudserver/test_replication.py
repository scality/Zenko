import pytest
import zenko_e2e.conf as conf
import zenko_e2e.util as util
import logging
import time
from ..fixtures import *

logging.basicConfig(level = logging.INFO,
				format =  '%(asctime)s %(name)s %(levelname)s: %(message)s',
				datefmt = '%S')

@pytest.mark.conformance
def test_aws_1_1(aws_crr_bucket, aws_crr_target_bucket, testfile):
	util.mark_test('AWS 1-1 REPLICATION')
	aws_crr_bucket.put_object(
		Body = testfile,
		Key = 'aws-crr-test'
	)
	print(aws_crr_bucket.name)
	assert util.check_object('aws-crr-test', testfile, aws_crr_bucket, aws_crr_target_bucket, timeout = 30)

@pytest.mark.conformance
def test_gcp_1_1(gcp_crr_bucket, gcp_crr_target_bucket, testfile):
	util.mark_test('GCP 1-1 REPLICATION')
	gcp_crr_bucket.put_object(
		Body = testfile,
		Key = 'gcp-crr-test'
	)
	assert util.check_object('gcp-crr-test', testfile, gcp_crr_bucket, gcp_crr_target_bucket, timeout = 30)

@pytest.mark.skip(reason ='Not implemented in tests')
@pytest.mark.conformance
def test_azure_1_1(azure_crr_bucket, azure_crr_target_bucket, testfile):
	util.mark_test('AZURE 1-1 REPLICATION')
	azure_crr_bucket.put_object(
		Body = testfile,
		Key = 'azure-crr-test'
	)
	assert util.check_object('azure-crr-test', testfile, azure_crr_bucket, azure_crr_target_bucket, timeout = 30)
@pytest.mark.skip(reason ='Not implemented in CI')
@pytest.mark.conformance
def test_wasabi_1_1(wasabi_crr_bucket, wasabi_crr_target_bucket, testfile):
	util.mark_test('AZURE 1-1 REPLICATION')
	wasabi_crr_bucket.put_object(
		Body = testfile,
		Key = 'wasabi-crr-test'
	)
	assert util.check_object('wasabi-crr-test', testfile, wasabi_crr_bucket, wasabi_crr_target_bucket, timeout = 30)

@pytest.mark.skip(reason ='Not implemented in CI')
@pytest.mark.conformance
def test_multi_1_M(multi_crr_bucket, aws_crr_target_bucket, gcp_crr_target_bucket, azure_crr_target_bucket, testfile):
	util.mark_test("MULTI 1-M REPLICATION")
	multi_crr_bucket.put_object(
		Body = testfile,
		Key = 'multi-crr-test'
	)
	assert util.check_object('multi-crr-test', testfile,
		multi_crr_bucket,
		aws_crr_target_bucket,
		gcp_crr_target_bucket,
		azure_crr_target_bucket,
		timeout = 30)
