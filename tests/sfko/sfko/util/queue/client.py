import json
import time
import uuid
from collections import namedtuple

from . import script
from ..mapping import get_keys
from ..redis import build_redis_client

Task = namedtuple('Task', ['type', 'name', 'bucket', 'key', 'size', 'bucket_conf'], defaults=[None]*6)

class BaseQueue:
    def __init__(self, name=None, namespace='queue'):
        if name is None:
            name = self._gen_uuid
        self._redis = build_redis_client()
        self._top_lvl = '%s:%s'%(namespace, name)
        self._epoch_key = '%s:%s'%(self._top_lvl, 'current-epoch')
        self._task_queue = '%s:%s'%(self._top_lvl, 'tasks')
        self._task_pending = '%s:%s'%(self._top_lvl, 'pending-tasks')
        self._results_queue = '%s:%s'%(self._top_lvl, 'results')
        self._roll_epoch = self._redis.register_script(script.ROLL_EPOCH)
        self._queue_add = self._redis.register_script(script.QUEUE_ADD)
        self._queue_get = self._redis.register_script(script.QUEUE_GET)

    def _gen_uuid(self):
        return uuid.uuid4().hex

    @property
    def _current_epoch(self):
        return self._redis.get(self._epoch_key)

    def roll_epoch(self):
        new_epoch = self._gen_uuid()
        return self._roll_epoch(
            keys=[self._epoch_key, self._task_queue, self._results_queue, self._task_pending],
            args=[self._current_epoch, new_epoch]
        ).decode('utf-8') == new_epoch

    def add_task(self, *args):
        self._queue_add(
            keys=[self._epoch_key, self._task_queue],
            args=[ None, *args ]
        )

    def add_result(self, *args):
        self._queue_add(
            keys=[self._epoch_key, self._results_queue, self._task_pending],
            args=args
        )

    def _poll(func):
        def inner(self, block=True, poll=2, timeout=None):
            current_time = time.time()
            out_of_time = current_time + timeout if timeout else None
            while out_of_time is None or current_time < out_of_time:
                res = func(self)
                if res is not None:
                    return res
                elif not block:
                    break
                sleep_time = poll
                if out_of_time is not None and current_time + poll >= out_of_time:
                    sleep_time =  out_of_time - current_time
                time.sleep(sleep_time)
                current_time = time.time()
            return None
        return inner

    @_poll
    def get_task(self):
        return self._queue_get(keys=[self._epoch_key, self._task_queue, self._task_pending])

    @_poll
    def get_result(self):
        return self._queue_get(keys=[self._epoch_key, self._results_queue])

    @property
    def qsize(self):
        return self._redis.llen(self._task_queue)

    @property
    def empty(self):
        return self.qsize == 0

    @property
    def pending(self):
        pending = self._redis.get(self._task_pending)
        if pending is None:
            return 0
        return int(pending)

    @_poll
    def complete(self):
        if self.empty and self.pending == 0:
            return True

    def iter_tasks(self, block=False, **kwargs):
        while True:
            task = self.get_task(block=block, **kwargs)
            if task is None:
                break
            yield task

    def iter_results(self, block=False, **kwargs):
        while True:
            result = self.get_result(block=block, **kwargs)
            if result is None:
                break
            yield result

class TaskQueue(BaseQueue):
    def add_task(self, *args):
        tasks = [get_keys(o, *Task._fields) for o in args]
        super().add_task(*(json.dumps(t) for t in tasks))

    def get_task(self, **kwargs):
        val = super().get_task(**kwargs)
        if val is not None:
            epoch, data = val
            task = json.loads(data)
            return epoch.decode('utf-8'), Task(**task)

    def add_result(self, epoch, task, completed):
        super().add_result(epoch, json.dumps((task._asdict(), completed)))

    def get_result(self, **kwargs):
        val = super().get_result(**kwargs)
        if val is not None:
            epoch, data = val
            task, completed = json.loads(data)
            return Task(**task), completed
