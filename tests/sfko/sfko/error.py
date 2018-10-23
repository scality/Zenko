from .constant import FILESIZE_SUFFIXES


class SFKOError(Exception):
    _tmpl = None
    _msg = None
    def __init__(self, *args, **kwargs):
        msg = self._msg if self._msg else 'An error has occurred!'
        if self._tmpl is not None:
            if args:
                msg = self._tmpl%args
            elif kwargs:
                msg = self._tmpl.format(**kwargs)
        super().__init__(msg)

class UnknownError(SFKOError):
    _msg = 'An unknown error has occurred (probably in a catch all)'

class NoConfigError(SFKOError):
    _tmpl = 'Could not find path %s to load!'

class InvalidConfigError(SFKOError):
    _tmpl = '%s contains an invalid configuration!'

class InvalidFileSizeError(SFKOError):
    def __init__(self, value):
        super().__init__('%s is not a valid filesize! Valid suffixes are %s'%(value, ', '.join(FILESIZE_SUFFIXES.keys())))

class InvalidSecretFormatError(SFKOError):
    _tmpl = 'Secret %s is incorrectly formatted'

class DuplicateSecretError(SFKOError):
    _tmpl = 'A secret named %s is already registered!'

class InvalidBackendFormatError(SFKOError):
    _tmpl = 'Backend %s is incorrectly formatted'

class DuplicateBackendError(SFKOError):
    _tmpl = 'A backend named %s is already registered!'

class RequiredKeyError(SFKOError):
    _tmpl = 'Required key %s is not present in %s'

class InvalidScenarioFormatError(SFKOError):
    _tmpl = 'Scenario %s is incorrectly formatted'

class DuplicateScenarioError(SFKOError):
    _tmpl = 'A scenario named %s is already registered'


class TestDoesntExistError(SFKOError):
    _tmpl = "A test with the name %s doesn't exist!"

class CheckDoesntExistError(SFKOError):
    _tmpl = "A check with the name %s doesn't exists!"
