from ..fixtures import *
import zenko_e2e.conf as conf
import time
import logging


@pytest.mark.skip(reason = 'This test requires manual work to complete')
def test_expiration(expiring_bucket, testfile):
	util.mark_test('LIFECYCLE EXPIRATION')
	expiry, bucket = expiring_bucket
	bucket.put_object(
		Body = testfile,
		Key = 'expire-test'
	)
	print(bucket.name)
	assert util.check_object('expire-test', testfile, bucket)
	time.sleep(conf.EXPIRY_DELTA.total_seconds() + 10)
	assert not util.check_object('expire-test', testfile, bucket)
