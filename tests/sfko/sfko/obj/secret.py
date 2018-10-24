from collections import defaultdict, namedtuple

from ..constant import SecretType
from ..error import (DuplicateSecretError, InvalidSecretFormatError,
                     RequiredKeyError)
from ..util.log import Log

_log = Log('obj.secret')

Secret = namedtuple('Secret', ['name', 'type', 'data'])


SECRETS = defaultdict(dict)

def get_secret(secret_type, name):
    return SECRETS.get(secret_type, {}).get(name)

def load_secret(data):
    if 'name' not in data:
        raise RequiredKeyError('name', 'Secret')
    try:
        stype = SecretType.to_constant(data.get('type'))
        _log.debug('Loading secret %s type: %s'%(data['name'], stype.repr()))
        if stype is None:
            raise InvalidSecretFormatError(data.get('name'))
        elif stype not in _TYPE_HANDLERS:
            raise InvalidSecretFormatError(data.get('name'))
        return _TYPE_HANDLERS[stype](data)
    except:
        raise InvalidSecretFormatError(data.get('name'))


def load_key(data):
    if data['name'] in SECRETS[SecretType.KEY]:
        raise DuplicateSecretError(data['name'])
    d = dict(access_key = data['access_key'], secret_key = data['secret_key'])
    secret = Secret(data['name'], SecretType.KEY, d)
    SECRETS[SecretType.KEY][data['name']] = secret
    return secret


_TYPE_HANDLERS = {
    SecretType.KEY: load_key,
}
