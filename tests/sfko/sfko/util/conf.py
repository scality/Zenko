import logging
import os
import os.path
import sys
from collections import namedtuple
from datetime import datetime
from pathlib import PosixPath

from .yaml import load_yaml

from ..error import InvalidConfigError, NoConfigError
from .mapping import createNamespace, recursivelyUpdateDict

# Config path load hiearchy
LOAD_ORDER = [
    os.environ.get('SFKO_CONF_DIR'),
    '%s/.sfko'%os.path.expanduser('~'),
    '.',
    './config/'
]

LOAD_ORDER = [PosixPath(p) for p in LOAD_ORDER if p]
# These can be overridden in the config file.
# They are just here some sensible defaults
# so the module shill functions
BUILT_IN_DEFAULTS = {
            'meta':{
                "version": "0.0.1",
                "app" : "sfko",
                },
            'logging': {
                "logfile" : None,
                "loglvl" : "info",
                "log_rotation": False,
                "logfmt" : '%(asctime)s %(name)s %(levelname)s: %(message)s',
                "datefmt" : '%d.%m.%y %I:%M:%S %p',
                'whitelist': [],
                'blacklist': [],
                },
            '_dump': False    # If True and the loaded config is empty
}                            #     Write out BUILT_IN_DEFAULTS and APP_DEFAULTS to the config after merging
                            # Keys prefaced with a '_' will not be written

# Intert default values for app config here
# instead of mixing them with BUILT_IN_DEFAULTS
# These can be use to override BUILT_IN_DEFAULTS as well
APP_DEFAULTS = {
    'mode': None,
    'seed': None,
    'zenko': {
        'host': 'http://zenko.local',
        'access_key': None,
        'secret_key': None
    },
    'logging': {
        'blacklist': ['botocore', 'boto3.resources', 'urllib3', 's3transfer']
    },
    'objects': {
        'default': {
            'size': '0B',
            'count': 1000
        },
    },
    'redis': {
        'host': 'localhost',
        'queue': 'op_queue'
    },
    'results': {
        'enabled': True,
        'schedule': '23:59'
    }
}

BUILT_IN_DEFAULTS = recursivelyUpdateDict(BUILT_IN_DEFAULTS, APP_DEFAULTS)

def parseLogLevel(text, default = 30):
    text = text.lower()
    levelValues = dict(
                critical = logging.CRITICAL,
                error = logging.ERROR,
                warning = logging.WARNING,
                info = logging.INFO,
                debug = logging.DEBUG
                )
    return levelValues.get(text, default)

def lookForFile(path):
    '''
    Tries to smartly find the absolute path of a config file.
    If the given path is absolute and exists return it unmodified, otherwise do usual leaf based lookup
    If the given path contains only a file name check for existence in LOAD_ORDER dirs returning if found
    If the given path contains a relative filepath check for existence in LOAD_ORDER joining each with the fragement
    '''
    path = PosixPath(path)
    if path.is_absolute() and path.exists():
        return path

    for confDir in LOAD_ORDER:
        if confDir.joinpath(path).exists():
            return confDir.joinpath(path).resolve()
    return None

def loadYAML(path):
    path = lookForFile(path)
    if not path:
        raise NoConfigError
    return load_yaml(path)

def loadFromEnv(key, default = None):
    return os.getenv(key, default)

def updateFromEnv(config, namespace = []):
    newConfig = config.copy()
    for key, value in config.items():
        if isinstance(value, dict):
            newConfig[key] = updateFromEnv(value, namespace=namespace + [key.upper()])
        else:
            configVar = '_'.join(namespace + [key.upper()])
            env = loadFromEnv(configVar)
            if env:
                newConfig[key] = env
    return newConfig

def loadConfig(path = None):
    defaults = {k: v for k, v in BUILT_IN_DEFAULTS.items() if not k[0] == '_'}
    try:
        loadedConfig = loadYAML(path) if path is not None else {}
    except NoConfigError:
        # print('WARNING: No config file found, falling back to defaults')
        loadedConfig = {}
    if loadedConfig is None and BUILT_IN_DEFAULTS['_dump'] and path:
        loadedConfig = {}
        with open(path, 'w') as cf:
            yaml.dump(defaults, cf, default_flow_style=False)
    config = recursivelyUpdateDict(defaults, loadedConfig)
    config = updateFromEnv(config)
    config['logging']['loglvl'] = parseLogLevel(config['logging']['loglvl']) # Parse the loglvl
    return createNamespace(config) # Return the config for good measure



config_path = 'config.yaml'
config = loadConfig(config_path)
