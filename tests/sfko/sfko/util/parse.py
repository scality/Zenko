from .. import error
from ..constant import FILESIZE_REGEX, FILESIZE_SUFFIXES


def parse_filesize(fs):
    if not FILESIZE_REGEX.match(fs):
        raise error.InvalidFileSizeError(fs)
    suffix = fs[-1:]
    size = fs[:-1]
    return int(size) * FILESIZE_SUFFIXES[suffix]
