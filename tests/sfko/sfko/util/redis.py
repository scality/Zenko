import json
import time
from collections import namedtuple
from functools import partial
from threading import Event, Thread

from redis import StrictRedis

from .conf import config
from .log import Log
from .mapping import get_keys

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

class RedisQueue(object):
    """Simple Queue with Redis Backend"""
    def __init__(self, name, namespace='queue'):
        """The default connection parameters are: host='localhost', port=6379, db=0"""
        self._redis= build_redis_client()
        self.key = '%s:%s' %(namespace, name)

    def qsize(self):
        """Return the approximate size of the queue."""
        return self._redis.llen(self.key)

    def empty(self):
        """Return True if the queue is empty, False otherwise."""
        return self.qsize() == 0

    def wait_for_empty(self, poll=2, timeout=0):
        timedout = time.time() + timeout
        while timeout == 0 or time.time() <= timedout:
            if self.empty():
                return True
            if timeout == 0:
                time.sleep(poll)
                continue
            elif time.time() + poll > timedout:
                time.sleep(timedout - time.time())
            else:
                time.sleep(poll)
        return self.qsize()

    def put(self, *args):
        """Put item into the queue."""
        _log.debug('Publishing to %s %s'%(self.key, str(args)))
        self._redis.rpush(self.key, *args)

    def get(self, block=True, timeout=None):
        """Remove and return an item from the queue.

        If optional args block is true and timeout is None (the default), block
        if necessary until an item is available."""
        if block:
            item = self._redis.blpop(self.key, timeout=timeout)
        else:
            item = self._redis.lpop(self.key)
        if item and block:
            item = item[1]
        _log.debug('Received msg from %s %s'%(self.key, str(item)))
        return item

    def get_nowait(self):
        """Equivalent to get(False)."""
        return self.get(False)

    def get_iter(self, **kwargs):
        while True:
            val = self.get(**kwargs)
            if val is None:
                break
            yield val


class TaskQueue(RedisQueue):
    def put(self, *args):
        tasks = [get_keys(o, *Task._fields) for o in args]
        super().put(*(json.dumps(t) for t in tasks))

    def get(self, **kwargs):
        val = super().get(**kwargs)
        if val is not None:
            task = json.loads(val)
            return Task(**task)


class ResultsQueue(RedisQueue):
    def put(self, task, completed):
        super().put(json.dumps((task._asdict(), completed)))

    def get(self, **kwargs):
        val = super().get(**kwargs)
        if val is not None:
            task, completed = json.loads(val)
            return Task(**task), completed


class PendingTaskQueue(TaskQueue):
    def __init__(self, name, namespace='queue'):
        self._pending_key = '%s:pending:%s'%(namespace, name)
        super().__init__('todo:%s'%name)

    def _incr(self):
        self._redis.incr(self._pending_key)

    def _decr(self):
        self._redis.decr(self._pending_key)

    def get(self, **kwargs):
        item = super().get(**kwargs)
        self._incr()
        return self._decr, item

    def done(self):
        return self.pending() == 0

    def pending(self):
        val = self._redis.get(self._pending_key)
        return 0 if val is None else int(val)

    def wait_until_done(self, poll=2, timeout=0):
        ret = self.wait_for_empty(poll=poll, timeout=timeout)
        if ret is not True:
            return ret
        timedout = time.time() + timeout
        while timeout == 0 or time.time() <= timedout:
            if self.done():
                return True
            if timeout == 0:
                time.sleep(poll)
                continue
            elif time.time() + poll > timedout:
                time.sleep(timedout - time.time())
            else:
                time.sleep(poll)
        return self.pending()
