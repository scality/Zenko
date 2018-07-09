import time

import pytest
import zenko_e2e.conf as conf

from ..fixtures import *


@pytest.mark.skip(reason='This test requires manual work to complete')
def test_expiration(expiring_bucket, testfile, objkey):
    util.mark_test('LIFECYCLE EXPIRATION')
    expiry, bucket = expiring_bucket  # pylint: disable=unused-variable
    bucket.put_object(
        Body=testfile,
        Key=objkey
    )
    assert util.check_object(objkey, testfile, bucket)
    time.sleep(conf.EXPIRY_DELTA.total_seconds() + 10)
    assert not util.check_object(objkey, testfile, bucket)
