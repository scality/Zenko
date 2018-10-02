import os.path

import yaml

from .. import error


def load_yaml(path):
    if not os.path.exists(path):
        raise error.NoConfigError
    try:
        with open(path) as yamlfile:
            data = yaml.load(yamlfile)
            assert(data is not None)
            return data
    except AssertionError:
        raise error.InvalidConfigError(path)
    except yaml.scanner.ScannerError:
        raise error.InvalidConfigError(path)
    except Exception:
        raise error.UnknownError
