


class ObjectStub:
	def __init__(self, k, v = None):
		def func(*args, **kwargs):
			pass
		setattr(self, k, v if v is not None else func)

class AzureResource:
	def __init__(self, service):
		self._service = service

	def Bucket(self, name):
		return AzureBucket(self._service, name)

class AzureBucket:
	def __init__(self, service, name):
		self._service = service
		self._name = name

	@property
	def name(self):
		return self._name

	def create(self):
		return self._service.create_container(self._name)

	def delete(self):
		return self._service.delete_container(self._name)

	def put_object(self, Key = None, Body = None):
		if Key is None or Body is None:
			raise Exception
		return self._service.create_blob_from_bytes(
			self._name,
			Key,
			Body
		)

	def download_fileobj(self, key, f):
		blob = self._service.get_blob_to_bytes(
			self._name,
			key
		)
		if blob:
			f.write(blob.content)
			return True
		else:
			raise Exception('Failed to get blob %s/%s from azure!'%(self._name, key))

	@property
	def objects(self):
		def f():
			return self._service.list_blobs(self._name)
		return ObjectStub('all', f)

	def Versioning(self):
		return ObjectStub('suspend')

	def  delete_blob(self, name):
		self._service.delete_blob(self._name, name, delete_snapshots = True)

def cleanup_azure_bucket(bucket, replicated = False, delete_bucket = True):
	blobs = list(bucket.objects.all())
	for blob in blobs:
		bucket.delete_blob(blob.name)
	if delete_bucket:
		bucket.delete()
