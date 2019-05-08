import hashlib
import math
from binascii import unhexlify
from s3transfer.utils import ChunksizeAdjuster
from s3transfer import TransferConfig

DEFAULT_CHUNKSIZE = TransferConfig().multipart_chunksize
MAX_FILESIZE = TransferConfig().multipart_threshold


def get_chunksize(filesize):
    return ChunksizeAdjuster().adjust_chunksize(DEFAULT_CHUNKSIZE, filesize)


# returns the size of the last chunk of an mpu (can be smaller than others)
def _get_last_chunksize(filesize, chunksize, parts):
    return chunksize - ((chunksize * parts) - filesize)

def _compute_mpu_etag(filesize):
    chunksize = get_chunksize(filesize)
    num_parts = math.ceil(filesize/float(chunksize))
    last_chunk = _get_last_chunksize(filesize, chunksize, num_parts)
    part_etag = hashlib.md5(b'0' * chunksize).hexdigest()
    last_part_etag = hashlib.md5(b'0' * last_chunk).hexdigest()
    as_bin = unhexlify(''.join([part_etag] * (num_parts - 1) + [last_part_etag]))
    return '%s-%i'%(hashlib.md5(as_bin).hexdigest(), num_parts)

def _compute_etag(filesize):
    return hashlib.md5(b'0' * filesize).hexdigest()

def compute_etag(filesize):
    if filesize >= MAX_FILESIZE:
        return _compute_mpu_etag(filesize)
    return _compute_etag(filesize)
