import pytest
from datetime import datetime
import zenko_e2e.util as util
import zenko_e2e.conf as conf

@pytest.fixture
def expiring_bucket(zenko_bucket):
	zenko_bucket.create()
	lc = zenko_bucket.LifecycleConfiguration()
	expiry = datetime.utcnow() + conf.EXPIRY_DELTA
	print('Expiring objects at %s'%expiry)
	doc = conf.EXPIRY_RULE.copy()
	doc['Rules'][0]['Expiration']['Date'] = expiry
	print(doc)
	lc.put(LifecycleConfiguration = doc)
	return expiry, zenko_bucket
