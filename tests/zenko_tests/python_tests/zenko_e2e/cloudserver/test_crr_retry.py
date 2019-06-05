import pytest
from ..fixtures import *


@pytest.mark.skip(reason='This test requires manual work to complete')
def test_crr_retry(aws_crr_bucket, aws_crr_target_bucket, testfile, objkey):
    util.mark_test('CRR RETRY')
    aws_crr_bucket.put_object(
        Body=testfile,
        Key=objkey
    )
    util.remark('Finished uploading')
    assert util.check_object(
        objkey, testfile, aws_crr_bucket, aws_crr_target_bucket)
