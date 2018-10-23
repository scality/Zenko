from pipewrench.pipeline import Filter
from pipewrench.pipeline import Router as BaseRouter

from ..execute import (CheckPipeline, ControllerPipeline, TestPipeline,
                       WorkerPipeline)
from ..register import CHECKS, TESTS
from .backend import BackendsWrapper
from .scenario import SCENARIOS
from .secret import SECRETS


class OppenValues:
    secrets = SECRETS
    backends = BackendsWrapper
    scenarios = SCENARIOS
    tests = TESTS
    checks = CHECKS

class Stage(Filter, OppenValues):
    pass

class Router(BaseRouter, OppenValues):
    _PIPELINE = None
    def __init__(self):
        if self._PIPELINE is not None:
            super().__init__(self._PIPELINE)
        else:
            super().__init__()

class TestRouter(Router):
    _PIPELINE = TestPipeline

class CheckRouter(Router):
    _PIPELINE = CheckPipeline

class WorkerRouter(Router):
    _PIPELINE = WorkerPipeline
