import pytest
import zenko_e2e.conf as conf
import zenko_e2e.util as util


@pytest.fixture(scope='function')
def objkey_unicode():
    return '/'.join([conf.OBJ_PREFIX, util.make_name('éléphant')])


@pytest.fixture(scope='function')
def objkey():
    return '/'.join([conf.OBJ_PREFIX, util.make_name('test-object')])


@pytest.fixture
def empty_object(zenko_bucket, objkey):
    zenko_bucket.create()
    return zenko_bucket.Object(objkey)


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
    name1 = objkey()
    name2 = objkey()
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
