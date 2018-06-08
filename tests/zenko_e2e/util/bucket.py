import logging
import uuid
import hashlib
import tempfile
import time
import zenko_e2e.conf as conf

_log = logging.getLogger('util.bucket')

def gen_bucket_name(root = 'zenko-test-bucket'):
	return '%s-%s'%(root, uuid.uuid4().hex)

def hashobj(data):
	return hashlib.md5(data).hexdigest()

def enable_versioning(bucket):
	_log.info('Enabling bucket versioning on %s'%bucket.name)
	v = bucket.Versioning().enable()

def get_object_hash(bucket, key, timeout = 0, backoff = 5, ts = None):
	if ts is None:
		ts = time.time()
	try:
		with tempfile.TemporaryFile() as f:
			bucket.download_fileobj(key, f)
			f.seek(0)
			return hashobj(f.read())
	except Exception as e:
		if time.time() - ts > timeout:
			_log.error('Unable to retrieve remote file (%s/%s) for hashing!'%(bucket.name, key))
			_log.exception(e)
			return None
		else:
			time.sleep(backoff)
			return get_object_hash(bucket, key, timeout, ts = ts, backoff = backoff)

def check_object(key, data, local, *args, timeout = 0, backoff = 5):
	refHash = hashobj(data)
	localHash = get_object_hash(local, key, timeout, backoff)
	if localHash is None:
		_log.error('Unable to retrieve %s/%s from zenko'%(local.name, key))
		contents = list(local.objects.all())
		_log.debug('%s bucket contents %s'%(local.name, contents))
	if not refHash == localHash:
		_log.error('Local object hash != data hash')
		return False
	passed = True
	for bucket in args:
		remotekey = '%s/%s'%(local.name, key) if not conf.BUCKET_MATCH  and local is not bucket else key
		rHash = get_object_hash(bucket, remotekey, timeout, backoff)
		if rHash is None:
			_log.error('Unable to retrieve %s/%s from cloud backend'%(bucket.name, remotekey))
			contents = list(bucket.objects.all())
			_log.debug('%s bucket contents %s'%(bucket.name, contents))
		if not rHash == refHash:
			_log.error('Object in %s did not match data!'%bucket)
			passed = False
	return passed

def cleanup_bucket(bucket, replicated = False, delete_bucket = True):
	if replicated:
		bucket.Versioning().suspend()
	client = bucket.meta.client
	IsTruncated = True
	MaxKeys = 1000
	KeyMarker = None
	Bucket = bucket.name
	Prefix = ''
	while IsTruncated == True:
		if not KeyMarker:
			version_list = client.list_object_versions(
				Bucket=Bucket,
				MaxKeys=MaxKeys,
				Prefix=Prefix)
		else:
			version_list = client.list_object_versions(
				Bucket=Bucket,
				MaxKeys=MaxKeys,
				Prefix=Prefix,
				KeyMarker=KeyMarker)

		try:
			objects = []
			versions = version_list['Versions']
			for v in versions:
				objects.append({'VersionId':v['VersionId'],'Key': v['Key']})
			response = client.delete_objects(Bucket=Bucket,Delete={'Objects':objects})
			print(response)
		except:
			pass

		try:
			objects = []
			delete_markers = version_list['DeleteMarkers']
			for d in delete_markers:
				objects.append({'VersionId':d['VersionId'],'Key': d['Key']})
			response = client.delete_objects(Bucket=Bucket,Delete={'Objects':objects})
			print(response)
		except:
			pass

		IsTruncated = version_list['IsTruncated']
		if IsTruncated:
			KeyMarker = version_list['NextKeyMarker']
	if delete_bucket:
		bucket.delete()
