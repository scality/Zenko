from .obj import backend, scenario, secret
from .util import schema
from .util.log import Log
from .util.conf import loadYAML

_log = Log('load')


def load_secrets():
    data = loadYAML('secrets.yaml')
    schema.assert_key(data, 'secrets')
    return len(list(map(secret.load_secret, data['secrets'])))

def load_backends():
    data = loadYAML('backends.yaml')
    schema.assert_key(data, 'backends')
    return len(list(map(backend.load_backend, data['backends'])))

def load_scenarios():
    data = loadYAML('scenarios.yaml')
    schema.assert_key(data, 'scenarios')
    return len(list(map(scenario.load_scenario, data['scenarios'])))

def load():
    secrets = load_secrets()
    backends = load_backends()
    scenarios = load_scenarios()
    _log.info('Loaded %s secrets, %s backends, %s scenarios'%(secrets, backends, scenarios))
