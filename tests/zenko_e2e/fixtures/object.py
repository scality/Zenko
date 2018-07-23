import pytest
import zenko_e2e.conf as conf
import zenko_e2e.util as util


@pytest.fixture
def objkey():
    return util.make_name('test-object')


@pytest.fixture
def empty_object(zenko_bucket):
    zenko_bucket.create()
    name = util.gen_bucket_name('test-object')
    return zenko_bucket.Object(name)


@pytest.fixture
def metadata_object(empty_object, emptyfile):
    empty_object.put(
        Body=emptyfile,
        Metadata=conf.METADATA_EXAMPLE
    )
    return empty_object


@pytest.fixture
def metadata_multi(zenko_bucket, emptyfile):
    zenko_bucket.create()
    name1 = util.gen_bucket_name('test-object')
    name2 = util.gen_bucket_name('test-object')
    obj1 = zenko_bucket.Object(name1)
    obj2 = zenko_bucket.Object(name2)
    obj1.put(
        Body=emptyfile,
        Metadata=conf.METADATA_EXAMPLE
    )
    obj2.put(
        Body=emptyfile,
        Metadata=conf.METADATA_EXAMPLE2
    )
    return (obj1, obj2)


@pytest.fixture
def zenko_object(empty_object, testfile):
    empty_object.put(
        Body=testfile
    )
    return empty_object
