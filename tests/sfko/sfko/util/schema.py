from ..error import RequiredKeyError
from .log import Log

_log = Log('assert')

def assert_key(mapping, key, target = 'mapping'):
    if key not in mapping:
        raise RequiredKeyError(key, target)
    return True

def assert_wmsg(condition, msg = 'Assertion Failed!'):
    try:
        assert(condition)
    except AssertionError as e:
        _log.error(msg)
        raise e
