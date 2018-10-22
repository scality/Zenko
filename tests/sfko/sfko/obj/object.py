import hashlib
import os
import uuid
from binascii import unhexlify

from ..util.conf import config
from ..util.parse import parse_filesize


class FakeFile:
    def __init__(self, size, content = b'0', parent=None):
        self._size = size
        self._pos = 0
        self._content = bytes(content)
        self._parent = parent

    def _etag(self, data):
        # print('-'*4)
        if self._parent:
            etag = hashlib.md5(data).hexdigest()
            # print(etag)
            self._parent._report_etag(etag)
        return data

    def _makebytes(self, num):
        self._pos += num
        return self._content * num

    def _readbytes(self, num):
        return self._etag(self._makebytes(num))

    def read(self, num = -1):
        if num == -1:
            return self._readbytes(self._size)
        if self._pos == self._size:
            return self._readbytes(0)
        elif self._size < self._pos + num:
            return self._readbytes(self._size - self._pos)
        return self._readbytes(num)

    def seek(self, offset, from_what = os.SEEK_SET):
        if from_what == os.SEEK_SET:
            self._pos = offset
        elif from_what == os.SEEK_CUR:
            self._pos += offset
        elif from_what == os.SEEK_END:
            self._pos = self._size - offset
        return self._pos

    def tell(self):
        return self._pos

    def close(self):
        pass

class ObjectProxy:
    def __init__(self, resource, bucket, count = None, size = None, prefix = None):
        self._count = count if count else config.objects.default.count
        size = size if size is not None else config.objects.default.size
        self._size = parse_filesize(size)
        self._prefix = prefix
        self._resource = resource
        self._bucket = bucket
        self._objects = []
        self._etags = []
        self._etag = None

    @property
    def filesize(self):
        return self._size

    @property
    def count(self):
        return self._count

    def _name(self):
        if self._prefix:
            return '%s/%s'%(self._prefix, uuid.uuid4().hex)
        return uuid.uuid4().hex

    def _file(self):
        return FakeFile(self._size, parent=self)

    def __iter__(self):
        for i in range(self._count):
            name = self._name()
            obj = self._resource.Object(self._bucket, name)
            self._objects.append(name)
            yield obj, self._file()
            self._compute_etag()

    @property
    def objects(self):
        for o in self._objects:
            yield self._bucket, o

    @property
    def raw(self):
        for obj, data in self:
            yield self._bucket, obj.key, self._size

    @property
    def resource(self):
        return self._resource

    @property
    def client(self):
        return self._resource.meta.client

    def _report_etag(self, etag):
        if self._etag is None:
            self._etags.append(etag)

    def _compute_etag(self):
        if self._etag is None:
            if len(self._etags) > 1:
                catted = ''.join(self._etags)
                binned = unhexlify(catted)
                etag = hashlib.md5(binned).hexdigest()
                self._etag = '%s-%i'%(etag, len(self._etags))
            else:
                self._etag = self._etags[0]
            self._etags = []
        return self._etag

    @property
    def etag(self):
        if not self._etag:
            return self._compute_etag()
        return self._etag



class FakeObjectProxy(ObjectProxy):
    def __init__(self, resource, bucket, key, size):
        self._resource = resource
        self._bucket = bucket
        self._count = 1
        self._key = key
        self._size = size

    @property
    def objects(self):
        yield self._bucket, self._key

    def __iter__(self):
        yield self._resource.Object(self._bucket, self._key), self._size()

    @property
    def raw(self):
        yield self._bucket, self._key, self._size

    @property
    def resource(self):
        return self._resource

    @property
    def client(self):
        return self._resource.meta.client
