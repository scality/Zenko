import time
from datetime import datetime
from ..fixtures import *
from .. import conf


def test_expiration(expiring_bucket, testfile, objkey):
    util.mark_test('LIFECYCLE EXPIRATION')
    expiry, bucket = expiring_bucket  # pylint: disable=unused-variable
    bucket.put_object(
        Body=testfile,
        Key=objkey
    )
    wait_time = 0
    now = datetime.utcnow()
    if expiry > now:
        wait_time = expiry - now
    wait_time += conf.EXPIRY_INTERVAL
    print('Waiting %i secs for lifecyle to run' % wait_time.total_seconds())
    assert util.check_object(objkey, testfile, bucket)
    time.sleep(wait_time.total_seconds())
    assert not util.check_object(objkey, testfile, bucket)
