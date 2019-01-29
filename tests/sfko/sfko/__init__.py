from .util import log
from .util.conf import config

__version__ = '0.1.4'

log.setupLogging('SFKO', __version__, **config.logging._asdict())

# This is need to cause the stages, test, and checks to autoregister
# It is done at the bottom so that our loggers are setup before import
from . import check, entry, stages, test
