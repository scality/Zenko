# pylint: disable=invalid-name,too-few-public-methods,unused-argument
import io
import time
from botocore.exceptions import WaiterError

from .. import conf


class ObjectStub:
    def __init__(self, **kwargs):
        def func(*args, **kwargs):
            pass
        for k, v in kwargs.items():
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

    def put_object(self, Key=None, Body=None):
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
        return ObjectStub(all=func)

    def Versioning(self):  # pylint: disable=no-self-use
        return ObjectStub(suspend=None)

    def delete_blob(self, name):
        self._service.delete_blob(self._name, name)

    def Object(self, key):
        def upload_fileobj(data, **kwargs):
            return self._service.create_blob_from_bytes(
                self._name,
                key,
                data.read()
            )

        def get():
            blob = self._service.get_blob_to_bytes(
                self._name,
                key
            )
            return dict(Body=io.BytesIO(blob))

        def wait_until_exists(**kwargs):
            for _ in range(20):
                if self._service.exists(self._name, key):
                    return True
                time.sleep(5)
            raise WaiterError('BlobNotFound', 'Max tries reached (20)', '')

        obj = ObjectStub(
            upload_fileobj=upload_fileobj,
            get=get,
            wait_until_exists=wait_until_exists,
            reload=None
        )
        obj.version_id = None  # pylint: disable=attribute-defined-outside-init
        return obj


def cleanup_azure_bucket(bucket, delete_bucket=True):
    blobs = list(bucket.objects.all())
    for blob in blobs:
        if blob.name.startswith(conf.OBJ_PREFIX):
            bucket.delete_blob(blob.name)
    if delete_bucket:
        bucket.delete()
