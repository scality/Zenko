

class ObjectStub:  # pylint: disable=too-few-public-methods
    def __init__(self, k, v=None):
        def func(*args, **kwargs):  # pylint: disable=unused-argument
            pass
        setattr(self, k, v if v is not None else func)


class AzureResource:  # pylint: disable=too-few-public-methods
    def __init__(self, service):
        self._service = service

    def Bucket(self, name):  # pylint: disable=invalid-name
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

    def put_object(self, Key=None, Body=None):  # pylint: disable=invalid-name
        if Key is None or Body is None:
            raise Exception
        return self._service.create_blob_from_bytes(
            self._name,
            Key,
            Body
        )

    def download_fileobj(self, key, ofile):
        blob = self._service.get_blob_to_bytes(
            self._name,
            key
        )
        if blob:
            ofile.write(blob.content)
            return True
        else:
            raise Exception('Failed to get blob %s/%s from azure!' %
                            (self._name, key))

    @property
    def objects(self):
        def func():
            return self._service.list_blobs(self._name)
        return ObjectStub('all', func)

    def Versioning(self):  # pylint: disable=invalid-name, no-self-use
        return ObjectStub('suspend')

    def delete_blob(self, name):
        self._service.delete_blob(self._name, name)


def cleanup_azure_bucket(bucket, delete_bucket=True):
    blobs = list(bucket.objects.all())
    for blob in blobs:
        bucket.delete_blob(blob.name)
    if delete_bucket:
        bucket.delete()
