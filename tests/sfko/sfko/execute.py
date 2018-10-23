from collections import OrderedDict
from datetime import datetime
from threading import Lock

from pipewrench import BaseFitting, PipeFitting

from . import s3
from .obj.environment import Environment

# MainPipeline = BaseFitting()
MainPipeline = PipeFitting()

# TestPipeline = BaseFitting()
TestPipeline = PipeFitting()

# CheckPipeline = BaseFitting()
CheckPipeline = PipeFitting()

StandAlonePipeline = BaseFitting()
WorkerPipeline = BaseFitting()
ControllerPipeline = BaseFitting()

def Execute(mode='standalone', **kwargs):
    env = Environment(
            zenko=s3.build_client_zenko(),
            mode=mode,
            **kwargs
            )
    MainPipeline.Invoke(env)
    submit_result(env.scenario, env.success, env.failed_tests, env.failed_checks)

_RESULTS = OrderedDict()
_RESULTS_LOCK = Lock()

def get_results():
    with _RESULTS_LOCK:
        res = _RESULTS.copy()
        _RESULTS.clear()
    return res


# Oct 27 23:35

def _make_ts():
    return datetime.utcnow().strftime('%b %d, %H:%M')

def submit_result(*args):
    ts = _make_ts()
    with _RESULTS_LOCK:
        _RESULTS[ts] = args
    return ts
