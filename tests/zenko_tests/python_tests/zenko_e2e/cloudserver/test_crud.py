from ..fixtures import *


def test_put_unicode(zenko_bucket, testfile, objkey_unicode):
    util.mark_test('CRUD')
    bucket = zenko_bucket  # pylint: disable=unused-variable
    bucket.put_object(
        Body=testfile,
        Key=objkey
    )
    assert util.check_object(objkey, testfile, bucket)
