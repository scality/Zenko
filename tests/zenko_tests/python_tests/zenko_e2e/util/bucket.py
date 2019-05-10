import logging
import uuid
import hashlib
import tempfile
import time
from boto3.s3.transfer import TransferConfig
from botocore.exceptions import ClientError, WaiterError
import requests
from awsauth import S3Auth
import zenko_e2e.conf as conf

_log = logging.getLogger('util.bucket')  # pylint: disable=invalid-name


def bucket_safe_create(bucket):
    try:
        bucket.create()
    except bucket.meta.client.exceptions.BucketAlreadyOwnedByYou:
        print('Bucket %s already exists!' % bucket.name)
    except Exception as exp:  # pylint: disable=broad-except
        print('Error creating bucket %s' % bucket.name)
        logging.exception(exp)
        raise exp


def gen_bucket_name(root='zenko-test-bucket'):
    return '%s-%s' % (root, uuid.uuid4().hex)


def hashobj(data):
    return hashlib.md5(data).hexdigest()


def enable_versioning(bucket):
    _log.info('Enabling bucket versioning on %s', bucket.name)
    bucket.Versioning().enable()


def get_object_hash(bucket, key, timeout=0, backoff=5, _timestamp=None):
    if _timestamp is None:
        _timestamp = time.time()
    try:
        with tempfile.TemporaryFile() as tfile:
            bucket.download_fileobj(key, tfile)
            tfile.seek(0)
            return hashobj(tfile.read())
    except Exception as exp:  # pylint: disable=broad-except
        if time.time() - _timestamp > timeout:
            _log.error(
                'Unable to retrieve remote file (%s/%s) for hashing!',
                bucket.name, key)
            _log.exception(exp)
            return None
    time.sleep(backoff)
    return get_object_hash(bucket, key, timeout,
                           _timestamp=_timestamp, backoff=backoff)


def wait_for_object(bucket, key, version_id=None, tries=1):
    kwargs = {}
    if version_id is not None:
        kwargs['VersionId'] = version_id
    for _ in range(tries):
        try:
            bucket.Object(key).wait_until_exists(**kwargs)
            return True
        except WaiterError:
            pass
    return False

def get_object(bucket, key, version_id=None, tries=1):
    if wait_for_object(bucket, key, version_id=version_id, tries=tries):
        resp = bucket.Object(key).get()
        return True, hashobj(resp['Body'])
    else:
        return False, None


def check_remote_object(bucket, key, ref_hash, version_id=None, tries=1):
    success, remote_hash = get_object(bucket, key, version_id, tries)
    if not success:
        err = 'Failed to retrieve object from %s/%s'%(bucket.name, key)
        _log.error(err)
        return False, err
    if not ref_hash == remote_hash:
        err = 'Reference hash != hash from %s/%s'%(bucket.name, key)
        _log.error(err)
        return False, err
    return True, None

def check_object(key, data, local, remote, version_id=None, tries=1):
    if not isinstance(remote, list):
        remote = [remote]
    reference_hash = hashobj(data)
    passed, error = check_remote_object(local, key, reference_hash,
                        version_id, tries)
    if not passed:
        _log.error(err)
        return False
    for bucket in remote:
        passed, error = check_remote_object(bucket, key, reference_hash,
                        tries=tries)
        if not passed:
            _log.error(error)
            return False
    return True

# def check_object(key, data, local, *args, timeout=0, backoff=5, version_id=None):
#     ref_hash = hashobj(data)
#     local_hash = get_object_hash(local, key, timeout, backoff)
#     if local_hash is None:
#         _log.error('Unable to retrieve %s/%s from zenko', local.name, key)
#         contents = list(local.objects.all())
#         _log.debug('%s bucket contents %s', local.name, contents)
#     if ref_hash != local_hash:
#         _log.error('Local object hash != data hash')
#         return False
#     passed = True
#     for bucket in args:
#         remotekey = '%s/%s' % (local.name,
#                 key) if not conf.BUCKET_MATCH and local is not bucket else key  # noqa pylint: disable=bad-continuation
#         remote_hash = get_object_hash(bucket, remotekey, timeout, backoff)
#         if remote_hash is None:
#             _log.error('Unable to retrieve %s/%s from cloud backend',
#                        bucket.name, remotekey)
#             contents = list(bucket.objects.all())
#             _log.debug('%s bucket contents %s', bucket.name, contents)
#         if remote_hash != ref_hash:
#             _log.error('Object in %s did not match data!', bucket)
#             passed = False
#     return passed


def cleanup_bucket(bucket, replicated=False, delete_bucket=True): # noqa pylint: disable=too-many-locals
    if replicated:
        bucket.Versioning().suspend()
    client = bucket.meta.client
    is_truncated = True
    max_keys = 1000
    key_marker = None
    bucket_name = bucket.name
    prefix = ''
    while is_truncated:
        if not key_marker:
            version_list = client.list_object_versions(
                Bucket=bucket_name,
                MaxKeys=max_keys,
                Prefix=prefix)
        else:
            version_list = client.list_object_versions(
                Bucket=bucket_name,
                MaxKeys=max_keys,
                Prefix=prefix,
                KeyMarker=key_marker)

        try:
            objects = []
            versions = version_list['Versions']
            for v in versions:  # pylint: disable=invalid-name
                if v['Key'].startswith(conf.OBJ_PREFIX):
                    objects.append(
                        {'VersionId': v['VersionId'], 'Key': v['Key']})
            response = client.delete_objects(
                Bucket=bucket_name, Delete={'Objects': objects})
            print(response)
        except BaseException:
            pass

        try:
            objects = []
            delete_markers = version_list['DeleteMarkers']
            for d in delete_markers:  # pylint: disable=invalid-name
                if d['Key'].startswith(conf.OBJ_PREFIX):
                    objects.append(
                        {'VersionId': d['VersionId'], 'Key': d['Key']})
            response = client.delete_objects(
                Bucket=bucket_name, Delete={'Objects': objects})
            print(response)
        except BaseException:
            pass

        is_truncated = version_list['IsTruncated']
        if is_truncated:
            key_marker = version_list['NextKeyMarker']
    if delete_bucket:
        bucket.delete()


def cleanup_gcp_bucket(bucket, delete_bucket=False):
    for obj in bucket.objects.all():
        if obj.key.startswith(conf.OBJ_PREFIX):
            obj.delete()
    if delete_bucket:
        bucket.delete()


UPLOAD_CONFIG = TransferConfig(multipart_threshold=10 * 1024 * 1024)  # 10MB


# def upload_object(bucket, key, data, **kwargs):
#     with tempfile.TemporaryFile() as upload:
#         upload.write(data)
#         upload.seek(0)
#         return bucket.upload_fileobj(upload,
#                                      key,
#                                      Config=UPLOAD_CONFIG,
#                                      ExtraArgs=kwargs)


# Returns  <bool>, <str/None>
#         success, version_id
def upload_object(bucket, key, data, _retries = 3, **kwargs):
    obj = bucket.Object(key)
    with tempfile.TemporaryFile() as upload:
        upload.write(data)
        upload.seek(0)
        # We use upload_fileobj as its a managed auto-mpu transfer
        obj.upload_fileobj(upload, ExtraArgs=kwargs)
    try:
        obj.reload() # Refresh object metadata from server
        return True, obj.version_id
    except ClientError:
        _log.error('Falied to upload file, retrying... %i/3'%(str(3-retires)))
        if _retries > 0:
            return upload_object(bucket, key, data, _retries=_retries-1, **kwargs)
    return False, None

def get_from_preferred_read(bucket, key, location):
    auth = S3Auth(conf.ZENKO_ACCESS_KEY,
                  conf.ZENKO_SECRET_KEY,
                  service_url=conf.ZENKO_ENDPOINT)
    url = '%s/%s/%s' % (conf.ZENKO_ENDPOINT, bucket, key)
    headers = {'x-amz-location-constraint': location}
    resp = requests.get(url, headers=headers,
                        auth=auth,
                        verify=conf.VERIFY_CERTIFICATES)
    if resp.status_code == 200:
        return resp.content
    print('Get from preferred read returned status code %s with body %s' %
          (resp.status_code, resp.content))
    return None
