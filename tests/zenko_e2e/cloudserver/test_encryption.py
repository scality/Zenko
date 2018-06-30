from zenko_e2e.fixtures import *
import zenko_e2e.util as util
import logging

logging.basicConfig(level = logging.INFO,
				format =  '%(asctime)s %(name)s %(levelname)s: %(message)s',
				datefmt = '%S')

_log = logging.getLogger('test')

def test_serverside_encryption(encrypted_bucket, aws_target_bucket, testfile, objkey):
    _log.info('Using endpoint %s'%conf.ZENKO_AWS_ENDPOINT)
    encrypted_bucket.put_object(
        Key = objkey,
        Body = testfile
    )
    refHash = util.hashobj(testfile)
    localHash = util.get_object_hash(encrypted_bucket, objkey)
    assert refHash == localHash
    remotekey = '%s/%s'%(encrypted_bucket.name, objkey) if not conf.BUCKET_MATCH else objkey
    remoteHash = util.get_object_hash(aws_target_bucket, objkey, timeout=30)
    assert remoteHash is not None and refHash != remoteHash
