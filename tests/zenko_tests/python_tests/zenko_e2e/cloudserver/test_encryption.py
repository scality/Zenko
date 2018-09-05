from zenko_e2e.fixtures import *
import zenko_e2e.util as util


def test_serverside_encryption(
        encrypted_bucket, aws_target_bucket, testfile, objkey):
    encrypted_bucket.put_object(
        Key=objkey,
        Body=testfile
    )
    ref_hash = util.hashobj(testfile)
    local_hash = util.get_object_hash(encrypted_bucket, objkey)
    assert ref_hash == local_hash
    remote_key = '%s/%s' % (encrypted_bucket.name,
                            objkey) if not conf.BUCKET_MATCH else objkey
    remote_hash = util.get_object_hash(
        aws_target_bucket, remote_key, timeout=30)
    assert remote_hash is not None and ref_hash != remote_hash
