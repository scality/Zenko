from datetime import datetime

import pytest
import zenko_e2e.conf as conf


@pytest.fixture
def expiring_bucket(zenko_bucket):
    zenko_bucket.create()
    loc = zenko_bucket.LifecycleConfiguration()
    expiry = datetime.utcnow() + conf.EXPIRY_DELTA
    print('Expiring objects at %s' % expiry)
    doc = conf.EXPIRY_RULE.copy()
    doc['Rules'][0]['Expiration']['Date'] = expiry
    print(doc)
    loc.put(LifecycleConfiguration=doc)
    return expiry, zenko_bucket
