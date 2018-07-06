import pytest
from zenko_e2e import conf


@pytest.fixture(scope='session', autouse=True)
def create_replication_buckets(zenko_resource):
    for bucket in conf.ZENKO_REPL_BUCKETS:
        zenko_resource.Bucket(bucket).create()
