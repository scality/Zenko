from botocore.handlers import set_list_objects_encoding_type_url
from boto3 import Session
import pytest
from azure.storage.blob import BlockBlobService  # noqa pylint: disable=no-name-in-module

from awsauth import S3Auth
import zenko_e2e.conf as conf
from zenko_e2e.util import AzureResource

# This Module contains pytest fixtures relating
# to the various backends zenko supports.
# All boto3 Sessions and Resources are created in the module.


@pytest.fixture
def vault():
    vault_session = Session(profile_name='zenko')
    return vault_session.resource(
        'iam', endpoint_url=conf.ZENKO_VAULT_ENDPOINT)


@pytest.fixture(scope='session')
def s3auth():
    return S3Auth(conf.ZENKO_ACCESS_KEY, conf.ZENKO_SECRET_KEY)


@pytest.fixture(scope='session')
def aws_resource():
    sesh = Session(aws_access_key_id=conf.AWS_ACCESS_KEY,
                   aws_secret_access_key=conf.AWS_SECRET_KEY).resource('s3')
    return sesh.resource('s3', endpoint_url=conf.AWS_ENDPOINT)


@pytest.fixture(scope='session')
def aws_crr_resource():
    sesh = Session(
        aws_access_key_id=conf.AWS_BACKBEAT_ACCESS_KEY,
        aws_secret_access_key=conf.AWS_BACKBEAT_SECRET_KEY).resource('s3')
    return sesh.resource('s3', endpoint_url=conf.AWS_ENDPOINT)


@pytest.fixture(scope='session')
def gcp_resource():
    sesh = Session(aws_access_key_id=conf.GCP_ACCESS_KEY,
                   aws_secret_access_key=conf.GCP_SECRET_KEY)
    sesh.events.unregister(
        'before-parameter-build.s3.ListObjects',
        set_list_objects_encoding_type_url)
    return sesh.resource('s3', endpoint_url=conf.GCP_ENDPOINT)


@pytest.fixture(scope='session')
def azure_resource():
    return AzureResource(
        BlockBlobService(
            account_name=conf.AZURE_ACCESS_KEY,
            account_key=conf.AZURE_SECRET_KEY,
            custom_domain=conf.AZURE_ENDPOINT
        )
    )


@pytest.fixture(scope='session')
def wasabi_resource():
    sesh = Session(profile_name='wasabi')
    return sesh.resource('s3', endpoint_url=conf.WASABI_ENDPOINT)


@pytest.fixture(scope='session')
def digital_ocean_resource():
    sesh = Session(profile_name='do')
    return sesh.resource('s3', endpoint_url=conf.DO_ENDPOINT)


@pytest.fixture(scope='session')
def ceph_resource():
    sesh = Session(aws_access_key_id=conf.CEPH_ACCESS_KEY,
                   aws_secret_access_key=conf.CEPH_SECRET_KEY)
    return sesh.resource('s3', endpoint_url=conf.CEPH_ENDPOINT)


@pytest.fixture(scope='session')
def zenko_resource():
    sesh = Session(aws_access_key_id=conf.ZENKO_ACCESS_KEY,
                   aws_secret_access_key=conf.ZENKO_SECRET_KEY)
    return sesh.resource('s3', endpoint_url=conf.ZENKO_ENDPOINT,
                         verify=conf.VERIFY_CERTIFICATES)


@pytest.fixture(scope='session')
def aws_endpoint_resource():
    sesh = Session(aws_access_key_id=conf.ZENKO_ACCESS_KEY,
                   aws_secret_access_key=conf.ZENKO_SECRET_KEY)
    return sesh.resource('s3', endpoint_url=conf.ZENKO_AWS_ENDPOINT,
                         verify=conf.VERIFY_CERTIFICATES)


@pytest.fixture(scope='session')
def gcp_endpoint_resource():
    sesh = Session(aws_access_key_id=conf.ZENKO_ACCESS_KEY,
                   aws_secret_access_key=conf.ZENKO_SECRET_KEY)
    return sesh.resource('s3', endpoint_url=conf.ZENKO_GCP_ENDPOINT,
                         verify=conf.VERIFY_CERTIFICATES)


@pytest.fixture(scope='session')
def azure_endpoint_resource():
    sesh = Session(aws_access_key_id=conf.ZENKO_ACCESS_KEY,
                   aws_secret_access_key=conf.ZENKO_SECRET_KEY)
    return sesh.resource('s3', endpoint_url=conf.ZENKO_AZURE_ENDPOINT,
                         verify=conf.VERIFY_CERTIFICATES)


@pytest.fixture(scope='session')
def wasabi_endpoint_resource():
    sesh = Session(aws_access_key_id=conf.ZENKO_ACCESS_KEY,
                   aws_secret_access_key=conf.ZENKO_SECRET_KEY)
    return sesh.resource('s3', endpoint_url=conf.ZENKO_WASABI_ENDPOINT,
                         verify=conf.VERIFY_CERTIFICATES)


@pytest.fixture(scope='session')
def digital_ocean_endpoint_resource():
    sesh = Session(aws_access_key_id=conf.ZENKO_ACCESS_KEY,
                   aws_secret_access_key=conf.ZENKO_SECRET_KEY)
    return sesh.resource('s3', endpoint_url=conf.ZENKO_DO_ENDPOINT,
                         verify=conf.VERIFY_CERTIFICATES)


@pytest.fixture(scope='session')
def ceph_endpoint_resource():
    sesh = Session(aws_access_key_id=conf.ZENKO_ACCESS_KEY,
                   aws_secret_access_key=conf.ZENKO_SECRET_KEY)
    return sesh.resource('s3', endpoint_url=conf.ZENKO_CEPH_ENDPOINT,
                         verify=conf.VERIFY_CERTIFICATES)
