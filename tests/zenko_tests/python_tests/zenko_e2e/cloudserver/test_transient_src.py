import time
from datetime import datetime, timedelta
from .. import util
from ..fixtures import *

TIMEOUT = timedelta(seconds=60)


def test_transient_src(transient_src_bucket, transient_target_bucket,
                       testfile, objkey):
    util.mark_test('TRANSIENT SOURCE')
    util.upload_object(transient_src_bucket, objkey, testfile)
    assert util.check_object(
        objkey, testfile, transient_target_bucket, tries=2)
    then = datetime.utcnow()
    passed = False
    while datetime.utcnow() - then < TIMEOUT:
        obj = util.get_from_preferred_read(conf.TRANSIENT_SRC_BUCKET,
                                           objkey, conf.TRANSIENT_BACKEND)
        if obj is None:
            passed = True
            break
        time.sleep(5)
    assert passed
