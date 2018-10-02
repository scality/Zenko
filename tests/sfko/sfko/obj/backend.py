from collections import defaultdict, namedtuple

from .. import constant
from ..error import DuplicateBackendError, InvalidBackendFormatError
from ..util import schema
from ..util.log import Log
from .secret import get_secret

_log = Log('obj.backend')

Backend = namedtuple('Backend', ['name', 'type', 'bucket', 'access_key', 'secret_key'])


BACKENDS = defaultdict(dict)

class BackendsWrapper():
    @staticmethod
    def get_backend(backend_type, name=None):
        if name is not None:
            return BACKENDS.get(backend_type, {}).get(name)
        return BACKENDS.get(backend_type, {})

    @staticmethod
    def _iter_backends():
        for backends in BACKENDS.values():
            for backend in backends.values():
                yield backend

    @classmethod
    def iter_backends(cls, backend_type = None, ignore_name = None, ignore_type = None):
        filters = []
        if isinstance(backend_type, list):
            filters.append(lambda b: b.type in backend_type)
        elif backend_type is not None:
            filters.append(lambda b: b.type is backend_type)
        if isinstance(ignore_name, list):
            filters.append(lambda b: b.name not in ignore_name)
        elif ignore_name is not None:
            filters.append(lambda b: b.name != ignore_name)
        if isinstance(ignore_type, list):
            filters.append(lambda b: b.type not in ignore_type)
        elif ignore_type is not None:
            filters.append(lambda b: b.type is not ignore_type)
        def bfilter(backend):
            for f in filters:
                if not f(backend):
                    return False
            return True
        for backend in filter(bfilter, cls._iter_backends()):
            yield backend

    @classmethod
    def list_backends(cls, **kwargs):
        return list(cls.iter_backends(**kwargs))

    @staticmethod
    def types():
        return list(BACKENDS.keys())



def get_backend(backend_type, name = None):
    if name is not None:
        return BACKENDS.get(backend_type, {}).get(name)
    return BACKENDS.get(backend_type, {})

def register_backend(backend):
    BACKENDS[backend.type][backend.name] = backend


def load_backend(data):
    schema.assert_key(data, 'name')
    try:
        btype = constant.BackendType.to_constant(data.get('type'))
        _log.debug('Loading backend %s type: %s'%(data['name'], btype.repr()))
        if btype is None or btype not in _TYPE_HANDLERS:
            raise InvalidBackendFormatError(data.get('name'))
        return _TYPE_HANDLERS[btype](**data)
    except:
        raise InvalidBackendFormatError(data.get('name'))


def load_generic(type, name, bucket, secret):
    btype = constant.BackendType.to_constant(type)
    if name in BACKENDS[btype]:
        raise DuplicateBackendError(name)
    sdata = get_secret(constant.SecretType.KEY, secret)
    if not sdata:
        raise InvalidBackendFormatError(name)
    backend = Backend(name, btype, bucket, sdata.data['access_key'], sdata.data['secret_key'])
    register_backend(backend)
    return backend


def load_azure(type, name, bucket, secret):
    pass


def load_sproxyd(type, name, bucket, secret):
    pass


_TYPE_HANDLERS = {
    constant.BackendType.AWS: load_generic,
    constant.BackendType.GCP: load_generic,
    constant.BackendType.AZR: load_azure,
    constant.BackendType.S3C: load_generic,
    constant.BackendType.SPD: load_sproxyd,
    constant.BackendType.ZNK: load_generic
}
