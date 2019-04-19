import re
import warnings

import requests

import pytest
import zenko_e2e.conf as conf
import zenko_e2e.util as util
from awsauth import S3Auth

BUCKET_NAME_FORMAT = re.compile(r'^[a-zA-Z0-9.\-_]{1,255}$')


def create_bucket(resource, name):
    if '"' in name:
        name = name.replace('"', '')
        warnings.warn('`"` found in bucket name! silently stripping')
    if BUCKET_NAME_FORMAT.fullmatch(name) is None:
        raise RuntimeError('%s is an invalid bucket name!')
    return resource.Bucket(name)

# These are buckets from the actual cloud backend


@pytest.fixture(scope='session')
def aws_target_bucket(aws_resource):
    bucket = create_bucket(aws_resource, conf.AWS_TARGET_BUCKET)
    yield bucket
    util.cleanup_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='session')
def gcp_target_bucket(gcp_resource):
    bucket = create_bucket(gcp_resource, conf.GCP_TARGET_BUCKET)
    yield bucket
    util.cleanup_gcp_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='session')
def azure_target_bucket(azure_resource):
    bucket = create_bucket(azure_resource, conf.AZURE_TARGET_BUCKET)
    yield bucket
    util.cleanup_azure_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='session')
def wasabi_target_bucket(wasabi_resource):
    bucket = create_bucket(wasabi_resource, conf.WASABI_TARGET_BUCKET)
    yield bucket
    util.cleanup_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='session')
def digital_ocean_target_bucket(digital_ocean_resource):
    bucket = create_bucket(digital_ocean_resource, conf.DO_TARGET_BUCKET)
    yield bucket
    util.cleanup_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='session')
def ceph_target_bucket(ceph_resource):
    bucket = create_bucket(ceph_resource, conf.CEPH_TARGET_BUCKET)
    yield bucket
    util.cleanup_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='session')
def aws_crr_target_bucket(aws_crr_resource):
    bucket = create_bucket(aws_crr_resource, conf.AWS_CRR_TARGET_BUCKET)
    yield bucket
    util.cleanup_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='session')
def gcp_crr_target_bucket(gcp_resource):
    bucket = create_bucket(gcp_resource, conf.GCP_CRR_TARGET_BUCKET)
    yield bucket
    util.cleanup_gcp_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='session')
def azure_crr_target_bucket(azure_resource):
    bucket = create_bucket(azure_resource, conf.AZURE_CRR_TARGET_BUCKET)
    yield bucket
    util.cleanup_azure_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='session')
def wasabi_crr_target_bucket(wasabi_resource):
    bucket = create_bucket(wasabi_resource, conf.WASABI_CRR_TARGET_BUCKET)
    yield bucket
    util.cleanup_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='session')
def digital_crr_ocean_bucket(digital_ocean_resource):
    bucket = create_bucket(digital_ocean_resource, conf.DO_CRR_TARGET_BUCKET)
    yield bucket
    util.cleanup_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='session')
def ceph_crr_target_bucket(ceph_resource):
    bucket = create_bucket(ceph_resource, conf.CEPH_CRR_TARGET_BUCKET)
    yield bucket
    util.cleanup_bucket(bucket, delete_bucket=False)

# A generic bucket in zenko


@pytest.fixture(scope='function')
def zenko_bucket(zenko_resource):
    name = util.gen_bucket_name()
    bucket = create_bucket(zenko_resource, name)
    yield bucket
    util.cleanup_bucket(bucket)

# These are buckets that exists in zenko, not on the actual cloud services
# They are configured to use backend specific endpoints,
# with default locations configured to the respective backend


@pytest.fixture
def aws_ep_bucket(aws_endpoint_resource):
    name = util.gen_bucket_name()
    bucket = create_bucket(aws_endpoint_resource, name)
    yield bucket
    util.cleanup_bucket(bucket)


@pytest.fixture
def gcp_ep_bucket(gcp_endpoint_resource):
    name = util.gen_bucket_name()
    bucket = create_bucket(gcp_endpoint_resource, name)
    yield bucket
    util.cleanup_bucket(bucket)


@pytest.fixture
def azure_ep_bucket(azure_endpoint_resource):
    name = util.gen_bucket_name()
    bucket = create_bucket(azure_endpoint_resource, name)
    yield bucket
    util.cleanup_bucket(bucket)


@pytest.fixture
def wasabi_ep_bucket(wasabi_endpoint_resource):
    name = util.gen_bucket_name()
    bucket = create_bucket(wasabi_endpoint_resource, name)
    yield bucket
    util.cleanup_bucket(bucket)


@pytest.fixture
def digital_ocean_ep_bucket(digital_ocean_endpoint_resource):
    name = util.gen_bucket_name()
    bucket = create_bucket(digital_ocean_endpoint_resource, name)
    yield bucket
    util.cleanup_bucket(bucket)


@pytest.fixture
def ceph_ep_bucket(ceph_endpoint_resource):
    name = util.gen_bucket_name()
    bucket = create_bucket(ceph_endpoint_resource, name)
    yield bucket
    util.cleanup_bucket(bucket)


# These buckets are configured using a LocationConstraint to each backend


@pytest.fixture
def aws_loc_bucket(zenko_bucket):
    loc_config = {'LocationConstraint': conf.AWS_BACKEND}
    zenko_bucket.create(
        CreateBucketConfiguration=loc_config
    )
    return zenko_bucket


@pytest.fixture
def gcp_loc_bucket(zenko_bucket):
    loc_config = {'LocationConstraint': conf.GCP_BACKEND}
    zenko_bucket.create(
        CreateBucketConfiguration=loc_config
    )
    return zenko_bucket


@pytest.fixture
def azure_loc_bucket(zenko_bucket):
    loc_config = {'LocationConstraint': conf.AZURE_BACKEND}
    zenko_bucket.create(
        CreateBucketConfiguration=loc_config
    )
    return zenko_bucket


@pytest.fixture
def wasabi_loc_bucket(zenko_bucket):
    loc_config = {'LocationConstraint': conf.WASABI_BACKEND}
    zenko_bucket.create(
        CreateBucketConfiguration=loc_config
    )
    return zenko_bucket


@pytest.fixture
def digital_ocean_loc_bucket(zenko_bucket):
    loc_config = {'LocationConstraint': conf.DO_BACKEND}
    zenko_bucket.create(
        CreateBucketConfiguration=loc_config
    )
    return zenko_bucket


@pytest.fixture
def ceph_loc_bucket(zenko_bucket):
    loc_config = {'LocationConstraint': conf.CEPH_BACKEND}
    zenko_bucket.create(
        CreateBucketConfiguration=loc_config
    )
    return zenko_bucket


@pytest.fixture(scope='function')
def nfs_loc_bucket(zenko_resource):
    nfs_ingest = conf.NFS_BACKEND + ':ingest'
    loc_config = {'LocationConstraint': nfs_ingest}
    bucket = create_bucket(zenko_resource, conf.NFS_TARGET_BUCKET)
    bucket.create(
        CreateBucketConfiguration=loc_config
    )
    return bucket

# These are bucket in zenko with replication enabled


@pytest.fixture(scope='function')
def aws_crr_bucket(zenko_resource):
    bucket = create_bucket(zenko_resource, conf.AWS_CRR_SRC_BUCKET)
    util.bucket_safe_create(bucket)
    yield bucket
    util.cleanup_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='function')
def gcp_crr_bucket(zenko_resource):
    bucket = create_bucket(zenko_resource, conf.GCP_CRR_SRC_BUCKET)
    util.bucket_safe_create(bucket)
    yield bucket
    util.cleanup_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='function')
def azure_crr_bucket(zenko_resource):
    bucket = create_bucket(zenko_resource, conf.AZURE_CRR_SRC_BUCKET)
    util.bucket_safe_create(bucket)
    yield bucket
    util.cleanup_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='function')
def wasabi_crr_bucket(zenko_resource):
    bucket = create_bucket(zenko_resource, conf.WASABI_CRR_SRC_BUCKET)
    util.bucket_safe_create(bucket)
    yield bucket
    util.cleanup_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='function')
def digital_ocean_crr_bucket(zenko_resource):
    bucket = create_bucket(zenko_resource, conf.DO_CRR_SRC_BUCKET)
    util.bucket_safe_create(bucket)
    yield bucket
    util.cleanup_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='function')
def ceph_crr_bucket(zenko_resource):
    bucket = create_bucket(zenko_resource, conf.CEPH_CRR_SRC_BUCKET)
    util.bucket_safe_create(bucket)
    yield bucket
    util.cleanup_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='function')
def multi_crr_bucket(zenko_resource):
    bucket = create_bucket(zenko_resource, conf.MULTI_CRR_SRC_BUCKET)
    util.bucket_safe_create(bucket)
    yield bucket
    util.cleanup_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='function')
def encrypted_bucket(aws_endpoint_resource):
    auth = S3Auth(conf.ZENKO_ACCESS_KEY,
                  conf.ZENKO_SECRET_KEY,
                  service_url=conf.ZENKO_AWS_ENDPOINT)
    name = util.gen_bucket_name()
    url = '%s/%s/' % (conf.ZENKO_AWS_ENDPOINT, name)
    headers = {'x-amz-scal-server-side-encryption': 'AES256'}
    requests.put(url, auth=auth, headers=headers,
                 verify=conf.VERIFY_CERTIFICATES)
    bucket = create_bucket(aws_endpoint_resource, name)
    yield bucket
    util.cleanup_bucket(bucket)


@pytest.fixture(scope='function')
def transient_src_bucket(zenko_resource):
    bucket = create_bucket(zenko_resource, conf.TRANSIENT_SRC_BUCKET)
    util.bucket_safe_create(bucket)
    yield bucket
    util.cleanup_bucket(bucket, delete_bucket=False)


@pytest.fixture(scope='session')
def transient_target_bucket(aws_resource):
    bucket = create_bucket(aws_resource, conf.AWS_CRR_TARGET_BUCKET)
    util.bucket_safe_create(bucket)
    yield bucket
    util.cleanup_bucket(bucket, delete_bucket=False)
