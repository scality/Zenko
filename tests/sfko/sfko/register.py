from collections import OrderedDict, namedtuple
from itertools import chain

from .util.mapping import get_keys, recursivelyUpdateDict

TESTS = OrderedDict()
CHECKS = OrderedDict()

Operation = namedtuple('Operation', ['name', 'func', 'kwargs', 'conf'])

OP_CONF_KEYS = ['objects', 'retry']

def _extract_conf(kwargs):
    return get_keys(kwargs, *OP_CONF_KEYS)

def _register(resource_type, name, func, **kwargs):
    op_conf = _extract_conf(kwargs)
    extra = {k: v for k, v in kwargs.items() if k not in op_conf}
    resource_type[name] = Operation(name, func, extra, op_conf)
    return func

def register_test(name, **kwargs):
    def inner(f):
        return _register(TESTS, name, f, **kwargs)
    return inner

def register_check(name, **kwargs):
    def inner(f):
        return _register(CHECKS, name, f, **kwargs)
    return inner

def get_test(name):
    return TESTS.get(name)

def get_check(name):
    return CHECKS.get(name)

def get_op(otype, name):
    if otype == 'test':
        return get_test(name)
    elif otype == 'check':
        return get_check(name)
    return None
