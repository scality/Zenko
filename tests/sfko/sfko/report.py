import datetime
import json
import sched
from collections import namedtuple, OrderedDict
from itertools import chain
from threading import Thread

import requests

from . import execute
from .util.conf import config
from .util.log import Log
from .util.redis import redis_client

_log = Log('report')


def utc_time():
    datetime.datetime.utcnow().timestamp()

class Scheduler(Thread):
    def __init__(self):
        super().__init__()
        self.daemon = True
        self._scheduler = sched.scheduler()

    def run(self):
        while True:
            self._scheduler.run()

    def enter(self, *args, **kwargs):
        return self._scheduler.enter(*args, **kwargs)

_RESULTS_SCHEDULER = Scheduler()

__hour, __minute = config.results.schedule.split(':')
_results_clock_time = datetime.time(hour=int(__hour), minute=int(__minute))

def _get_next_schedule():
    now = datetime.datetime.now()
    next_run = now + datetime.timedelta(seconds=20)
    # then = now + datetime.timedelta(days=1)
    # next_run = datetime.datetime.combine(then.date(), _RESULTS_SCHED_TIME)
    _log.debug('Next scheduler run at %s'%(next_run))
    return (next_run - now).total_seconds()

def init_scheduler():
    _log.debug('Initializing scheduler')
    _RESULTS_SCHEDULER.enter(_get_next_schedule(), 0, collect_results)
    _RESULTS_SCHEDULER.start()


# HIPCHAT_URL = 'https://scalitysocial.hipchat.com/v2/room/4661513/notification'
HIPCHAT_URL = 'https://scalitysocial.hipchat.com/v2/room/%s/notification'%config.results.hipchat.room
def notify(msg, color = 'yellow', notify = False):
    data = dict(
        message = msg,
        message_format = 'text',
        notify = notify,
        color = color
    )
    token = dict(auth_token=config.results.hipchat.token)
    resp = requests.post(HIPCHAT_URL, json = data, params=token)
    _log.debug(resp)


x = '''Op Failed:
  backend:\t{backend}
  bucket:\t{bucket}
  objects:\t{obj_count}
  size:\t\t{obj_size}
  versioning:\t{versioning}
  replication:\t{replication}
  transient:\t\t{transient}
  expiration:\t{expiration}'''


FAILURE_DETAILS = [
    'backend',
    'bucket',
    'objects',
    'size',
    'versioning',
    'replication',
    'transient',
    'expiration'
]

def sizeof_fmt(num, suffix='B'):
    for unit in ['','Ki','Mi','Gi','Ti','Pi','Ei','Zi']:
        if abs(num) < 1024.0:
            return "%3.1f%s%s" % (num, unit, suffix)
        num /= 1024.0
    return "%.1f%s%s" % (num, 'Yi', suffix)

def build_failures(op, bucket, oproxy, op_type = 'check'):
    if bucket.replication is not False:
        repl = bucket.replication.backend.type.friendly()
    else:
        repl = False
    deets = OrderedDict(
        backend='%s:%s'%(bucket.backend.type.friendly(), bucket.backend.bucket),
        bucket=bucket.name,
        objects=oproxy.count,
        size=sizeof_fmt(oproxy.filesize),
        versioning=bucket.versioning,
        replication=repl,
        transient=bucket.transient,
        expiration=bucket.expiration
    )
    lines = ['   Failed %s: %s'%(op_type, op.name)]
    for key in FAILURE_DETAILS:
        if deets[key] is not None and deets[key] is not False:
            lines.append('%s: %s'%(key, deets[key]))
    return '\n      '.join(lines)

def push_to_chat(results):
    lines = []
    failed = 0
    for ts, (scenario, success, failed_tests, failed_checks) in results.items():
        status = '(successful)' if success else '(failed)'
        sline = REPORT_LINE.format(scenario=scenario.name, ts=ts, status=status)
        lines.append(sline)
        if not success:
            for op, (bucket, oproxy) in chain(failed_tests, failed_checks):
                op_type = 'test' if (op, (bucket, oproxy)) in failed_tests else 'check'
                lines.append(build_failures(op, bucket, oproxy, op_type))
                failed += 1
    if failed == 0:
        color = 'green'
    else:
        color = 'red'
    if lines:
        rendered_report = REPORT_TEMPLATE.format(reports='\n'.join(lines))
        _log.debug('Publishing Results: %s'%rendered_report)
        notify(rendered_report, color = color)


REPORT_HEADER =' SFKO Nightly Results Report (catchemall)'
REPORT_LINE ='{status} {scenario}\t{ts}'
OPSTATUS_LINE='   {0}: {1}'

REPORT_TEMPLATE = '{header}\n{reports}'.format(header=REPORT_HEADER, reports='{reports}')


def collect_results():
    results = execute.get_results()
    _RESULTS_SCHEDULER.enter(_get_next_schedule(), 0, collect_results)
    return push_to_chat(results)
