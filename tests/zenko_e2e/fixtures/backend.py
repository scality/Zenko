from boto3 import Session
from botocore.handlers import set_list_objects_encoding_type_url

import zenko_e2e.conf as conf
import pytest
from awsauth import S3Auth
import configparser
import os.path

'''
This Module contains pytest fixtures relating to the various backends zenko supports.
All boto3 Sessions and Resources are created in the module.
'''


@pytest.fixture
def vault():
	vault_session = Session(profile_name='zenko')
	return vault_session.resource('iam', endpoint_url = conf.ZENKO_VAULT_ENDPOINT)

@pytest.fixture(scope = 'session')
def s3auth():
	return S3Auth(conf.ZENKO_ACCESS_KEY, conf.ZENKO_SECRET_KEY)

@pytest.fixture(scope = 'session')
def aws_resource():
	return Session(aws_access_key_id = conf.AWS_ACCESS_KEY,
                aws_secret_access_key = conf.AWS_SECRET_KEY).resource('s3')

@pytest.fixture(scope = 'session')
def gcp_resource():
	sesh = Session(aws_access_key_id = conf.GCP_ACCESS_KEY,
                aws_secret_access_key = conf.GCP_SECRET_KEY)
	sesh.events.unregister('before-parameter-build.s3.ListObjects', set_list_objects_encoding_type_url)
	return sesh.resource('s3', endpoint_url=conf.GCP_ENDPOINT)

@pytest.fixture(scope = 'session')
def azure_resource():
	s =  Session(aws_access_key_id = conf.AZURE_ACCESS_KEY,
                aws_secret_access_key = conf.AZURE_SECRET_KEY)
	return s.resource('s3', endpoint_url = conf.AZURE_ENDPOINT)

@pytest.fixture(scope = 'session')
def wasabi_resource():
	s =  Session(profile_name='wasabi')
	return s.resource('s3', endpoint_url = conf.WASABI_ENDPOINT)

@pytest.fixture(scope = 'session')
def digital_ocean_resource():
	s =  Session(profile_name='do')
	return s.resource('s3', endpoint_url = conf.DO_ENDPOINT)

@pytest.fixture(scope = 'session')
def zenko_resource():
	s =  Session(aws_access_key_id = conf.ZENKO_ACCESS_KEY,
                aws_secret_access_key = conf.ZENKO_SECRET_KEY)
	return s.resource('s3', endpoint_url = conf.ZENKO_ENDPOINT, verify = conf.VERIFY_CERTIFICATES)

@pytest.fixture(scope = 'session')
def aws_endpoint_resource():
	s =  Session(aws_access_key_id = conf.ZENKO_ACCESS_KEY,
                aws_secret_access_key = conf.ZENKO_SECRET_KEY)
	return s.resource('s3', endpoint_url = conf.ZENKO_AWS_ENDPOINT, verify = conf.VERIFY_CERTIFICATES)

@pytest.fixture(scope = 'session')
def gcp_endpoint_resource():
	s =  Session(aws_access_key_id = conf.ZENKO_ACCESS_KEY,
                aws_secret_access_key = conf.ZENKO_SECRET_KEY)
	return s.resource('s3', endpoint_url = conf.ZENKO_GCP_ENDPOINT, verify = conf.VERIFY_CERTIFICATES)

@pytest.fixture(scope = 'session')
def azure_endpoint_resource():
	s =  Session(aws_access_key_id = conf.ZENKO_ACCESS_KEY,
                aws_secret_access_key = conf.ZENKO_SECRET_KEY)
	return s.resource('s3', endpoint_url = conf.ZENKO_AZURE_ENDPOINT, verify = conf.VERIFY_CERTIFICATES)

@pytest.fixture(scope = 'session')
def wasabi_endpoint_resource():
	s =  Session(aws_access_key_id = conf.ZENKO_ACCESS_KEY,
                aws_secret_access_key = conf.ZENKO_SECRET_KEY)
	return s.resource('s3', endpoint_url = conf.ZENKO_WASABI_ENDPOINT, verify = conf.VERIFY_CERTIFICATES)

@pytest.fixture(scope = 'session')
def digital_ocean_endpoint_resource():
	s =  Session(aws_access_key_id = conf.ZENKO_ACCESS_KEY,
                aws_secret_access_key = conf.ZENKO_SECRET_KEY)
	return s.resource('s3', endpoint_url = conf.ZENKO_DO_ENDPOINT, verify = conf.VERIFY_CERTIFICATES)
