import logging
import sys

levels = dict(
        critical = logging.CRITICAL,
        error = logging.ERROR,
        warning = logging.WARNING,
        info = logging.INFO,
        debug = logging.DEBUG
        )

def parse_loglvl(level):
    return levels.get(level)

class Whitelist(logging.Filter):
    def __init__(self, *whitelist):
        self.whitelist = [logging.Filter(name) for name in whitelist]

    def filter(self, record):
        return any(f.filter(record) for f in self.whitelist)

class Blacklist(Whitelist):
    def filter(self, record):
        return not Whitelist.filter(self, record)

def formatter(logfmt = '%(asctime)s %(name)s %(levelname)s: %(message)s', datefmt = '%d.%m.%y %I:%M:%S %p'):
    return logging.Formatter(fmt=logfmt, datefmt=datefmt)

BASELOGGER = None

def setupLogging(
        name,
        version,
        loglvl = logging.DEBUG,
        logfile = None,
        log_rotation = False,
        logfmt = '%(asctime)s %(name)s %(levelname)s: %(message)s',
        datefmt = '%d.%m.%y %I:%M:%S %p',
        whitelist=[],
        blacklist=[],
    ):
    # Create our root logger and set the log lvl
    rootLogger = logging.getLogger()
    rootLogger.setLevel(loglvl)

    # Setup formatting
    # formatter = logging.Formatter(fmt=config.logging.logfmt, datefmt=config.logging.datefmt)

    # Add logging to stdout
    streamHandler = logging.StreamHandler()
    streamHandler.setFormatter(formatter(logfmt, datefmt))

    rootLogger.addHandler(streamHandler)

    # Setup log files and rotation if enabled
    if logfile is not None:
        if log_rotation:
            handler = logging.handlers.RotatingFileHandler(
                logfile, maxBytes=10*1024*1024, backupCount=2)
        else:
            handler = logging.FileHandler(logfile)

        handler.setFormatter(formatter(logfmt, datefmt))
        rootLogger.addHandler(handler)

    if whitelist:
        for handler in logging.root.handlers:
            handler.addFilter(Whitelist(*whitelist))
    elif blacklist:
        for handler in logging.root.handlers:
            handler.addFilter(Blacklist(*blacklist))
    baseLogger = rootLogger.getChild(name)
    baseLogger.info('Starting %s: version %s'%(name, version))
    setattr(sys.modules[__name__], 'BASELOGGER', baseLogger)
    return baseLogger


# return a nested child of root
# levels are indicated in name by "."
# eg. "root.foo.bar"
def get_logger(root, name):
    if not '.' in name:
        return root.getChild(name)
    lvl = name.split('.')
    return get_logger(root.getChild(lvl.pop(0)), '.'.join(lvl))

def Log(name):
    baselogger = BASELOGGER if BASELOGGER else logging.getLogger('root')
    return get_logger(baselogger, name)

def log_on_error(logger, target_handler = None, flush_lvl = logging.ERROR, capacity = 250):
    if target_handler is None:
        target_handler = logging.StreamHandler()
        target_handler.setFormatter(formatter())
    handler = logging.handlers.MemoryHandler(capacity, flushLevel = flush_lvl, target = target_handler)

    def decorator(fn):
        def wrapper(*args, **kwargs):
            logger.addHandler(handler)
            try:
                return fn(*args, **kwargs)
            except Exception:
                raise
            finally:
                super(logging.handlers.MemoryHandler, handler).flush()
                logger.removeHandler(handler)
        return wrapper
    return decorator
