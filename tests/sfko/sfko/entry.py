import argparse
import time

from . import load
from .execute import Execute as ExecuteStages
from .report import init_scheduler
from .util.conf import config
from .util.log import Log
from .util.redis import PendingTaskQueue, ResultsQueue

_log = Log('entry')

def get_args():
    parser = argparse.ArgumentParser(
        prog=config.meta.app,
        description='I am become death, destroyer of clusters.',
        epilog='If no options are provided %(prog)s will start in standalone mode')

    parser.add_argument('-c', '--controller', action='store_true', help='Start %(prog)s in controller mode')
    parser.add_argument('-w', '--worker', action='store_true', help='Start %(prog)s in worker mode')
    return parser.parse_args()


def _build_queues():
    tq = PendingTaskQueue('task')
    rq = ResultsQueue('results')
    return dict(task_queue=tq, results_queue=rq)

def start_distributed(mode):
    _log.info('----- Starting in %s mode -----'%mode)
    while True:
        ExecuteStages(mode=mode, **_build_queues())

def start_standalone():
    _log.info('Starting in standalone mode')
    while True:
        ExecuteStages()

def entry():
    args = get_args()
    load.load()
    mode = None
    if args.controller:
        mode = 'controller'
    elif args.worker:
        mode = 'worker'
    elif config.mode is not None:
        mode = config.mode

    if not mode == 'worker' and config.results.enabled:
        init_scheduler()

    if mode is None:
        start_standalone()
    else:
        start_distributed(mode)
