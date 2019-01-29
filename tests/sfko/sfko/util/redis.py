import json
from collections import namedtuple
from functools import partial

from redis import StrictRedis

from .conf import config
from .log import Log

_log = Log('util.redis')


Task = namedtuple('Task', ['type', 'name', 'bucket', 'key', 'size', 'bucket_conf'], defaults=[None]*6)
Request = namedtuple('Request', ['tag', 'method', 'bucket', 'key', 'status', 'cloud', 'cloud_bucket', 'url', 'extra'],
                                defaults=[None, None, None, None, None, None, None, None, {}])

def build_redis_client():
    return StrictRedis(host=config.redis.host)

redis_client = build_redis_client()

def delete_key(bucket, key = None, cloud = None):
    key = ':'.join([x for x in [bucket, key, cloud] if x is not None])
    redis_client.delete(key)

def _make_request(data):
    return Request(**json.loads(data))

def get_requests(bucket, key, cloud, start = 0, end = -1):
    redis_key = '%s:%s:%s'%(bucket, key, cloud)
    requests = list(map(_make_request, redis_client.lrange(redis_key, start, end)))
    remove = partial(delete_key, bucket, key, cloud)
    return remove, requests

def get_requests_by_method(bucket, key, cloud, method, start = 0, end = -1):
    remove, requests = get_requests(bucket, key, cloud, start, end)
    return remove, [x for x in requests if x.method == method]

def get_requests_by_tag(bucket, key, cloud, tag, start = 0, end = -1):
    remove, requests = get_requests(bucket, key, cloud, start, end)
    return remove, [x for x in requests if x.tag == tag]

def filter_requests(reqs, method = None, tag = None):
    delete_key = None
    if isinstance(reqs, tuple):
        delete_key, reqs = reqs
    def filter_func(req):
        if method is not None and req.method != method:
            return False
        if tag is not None and req.tag != tag:
            return False
        return True
    filtered = list(filter(filter_func, reqs))
    if delete_key:
        return delete_key, filtered
    return filtered

def start_after(reqs, method = None, tag = None):
    delete_key = None
    if isinstance(reqs, tuple):
        delete_key, reqs = reqs
    class FilterClass:
        seen = False
        def __call__(self, req):
            if method is not None and req.method != method:
                return False
            if tag is not None and req.tag != tag:
                return False
            self.seen = True
            return True
    filtered = list(filter(FilterClass(), reqs))
    if delete_key:
        return delete_key, filtered
    return filtered


def enqueue_replication(bucket, key, cloud):
    redis_key = 'replication:%s:%s:%s'%(cloud, bucket, key)
    _log.debug('Marking pending replication %s'%redis_key)
    redis_client.set(redis_key, (bucket, key), ex=86400)

def complete_replication(bucket, key, cloud):
    redis_key = 'replication:%s:%s:%s'%(cloud, bucket, key)
    _log.debug('Completing replication %s'%redis_client)
    redis_client.delete(redis_key)

def get_pending_replication(bucket = None, key = None, cloud = None):
    pattern = 'replication:'
    if cloud is not None:
        pattern += '%s:'%pattern
        if bucket is not None:
            pattern += '%s:'%bucket
            if key is not None:
                pattern += key
    if not cloud or not bucket or not key:
        pattern += '*'
    print(pattern)
    return redis_client.keys(pattern)

def count_pending_replication(*args, **kwargs):
    return len(get_pending_replication(*args, **kwargs))
