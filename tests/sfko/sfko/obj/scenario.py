from collections import namedtuple

from .. import error, register
from ..constant import BackendType
from ..util import schema
from ..util.log import Log
from ..util.mapping import createNamespace
from .backend import Backend

_log = Log('obj.scenario')

Scenario = namedtuple('Scenario', ['name', 'required', 'tests', 'checks', 'kwargs'])
Bucket = namedtuple('Bucket',
                    ['replication', 'transient', 'expiration', 'versioning', 'clouds', 'client', 'backend', 'name'],
                    defaults=[False, False, False, False, [], None, None, None])

_REQUIRED_ARGS = ['name', 'required', 'tests', 'checks']

SCENARIOS = dict()

def get_scenarios(name):
    return SCENARIOS.get(name)

def load_scenario(data):
    try:
        schema.assert_key(data, 'name')
        if data['name'] in SCENARIOS:
            raise error.DuplicateScenarioError(data['name'])
        _log.debug('Loading scenario %s'%data['name'])
        for field in _REQUIRED_ARGS:
            schema.assert_key(data, field)
        parsed = {'name': data.get('name')}
        parsed['required'] = parse_required(data.get('required'))
        parsed['tests'] = parse_tests(data.get('tests'))
        parsed['checks'] = parse_checks(data.get('checks'))
        kwargs = {}
        for key in filter(lambda k: k not in _REQUIRED_ARGS, data.keys()):
            _log.debug('Loading extra kwarg "%s"'%key)
            kwargs[key] = data[key]
        scenario = Scenario(**parsed, kwargs=kwargs)
        SCENARIOS[scenario.name] = scenario
    except error.RequiredKeyError as e:
        raise error.InvalidScenarioFormatError(data.get('name'))
    except Exception as e:
        raise e

def parse_required(reqs):
    schema.assert_key(reqs, 'buckets')
    parsed = dict(buckets=load_buckets(reqs['buckets']))
    return createNamespace(parsed, 'required')


def load_buckets(buckets):
    if isinstance(buckets, int):
        return tuple(Bucket() for i in range(buckets))
    elif isinstance(buckets, list):
        ret = []
        for b in buckets:
            bconf = b.copy()
            bconf['clouds'] = BackendType.to_constant(bconf['clouds'])
            if 'replication' in bconf:
                bconf['replication'] = BackendType.to_constant(bconf['replication'])
            ret.append(Bucket(**bconf))
        return tuple(ret)
        # return tuple(Bucket(**b) for b in buckets)
    else:
        raise error.InvalidScenarioFormatError()


def parse_tests(tests):
    parsed = []
    for name in tests:
        test = register.get_test(name)
        if test is None:
            raise error.TestDoesntExistError(name)
        parsed.append(test)
    return tuple(parsed)


def parse_checks(checks):
    parsed = []
    for name in checks:
        check = register.get_check(name)
        if check is None:
            raise error.CheckDoesntExistError(name)
        parsed.append(check)
    return tuple(parsed)


def _dump_clouds(clouds):
    return BackendType.to_int(clouds)

def _dump_backend(backend):
    data = backend._asdict()
    data['type'] = BackendType.to_int(backend.type)
    return data

def dump_bucket(bucket):
    data = bucket._asdict()
    data['clouds'] = _dump_clouds(bucket.clouds)
    data['backend'] = _dump_backend(bucket.backend)
    if bucket.replication:
        data['replication'] = _dump_backend(bucket.replication)
    data.pop('client')
    return data


def _load_backend(data):
    d = data.copy()
    d['type'] = BackendType.to_constant(data['type'])
    return Backend(**d)

def load_bucket(data):
    d = data.copy()
    d['backend'] = _load_backend(data['backend'])
    if isinstance(data['replication'], dict):
        d['replication'] = _load_backend(data['replication'])
    print(data['clouds'])
    d['clouds'] = BackendType.to_constant(data['clouds'])
    d['client'] = None
    return Bucket(**d)
