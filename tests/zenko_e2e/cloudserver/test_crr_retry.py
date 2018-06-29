from ..fixtures import *
import logging

logging.basicConfig(level = logging.DEBUG,
				format =  '%(asctime)s %(name)s %(levelname)s: %(message)s',
				datefmt = '%S')

@pytest.mark.skip(reason = 'This test requires manual work to complete')
def test_crr_retry(aws_crr_bucket, aws_crr_target_bucket, testfile, objkey):
	util.mark_test('CRR RETRY')
	aws_crr_bucket.put_object(
		Body = testfile,
		Key = objkey
	)
	util.remark('Finished uploading')
	input()
	assert util.check_object(objkey, testfile, aws_crr_bucket, aws_crr_target_bucket, timeout = 30)
