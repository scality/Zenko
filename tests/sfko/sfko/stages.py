import uuid
from itertools import chain
from pprint import pprint

from pipewrench.errors import RetryError, StopProcessingError

from . import constant, register, s3
from .execute import (CheckPipeline, ControllerPipeline, MainPipeline,
                      StandAlonePipeline, TestPipeline, WorkerPipeline)
from .obj.environment import Environment
from .obj.object import FakeObjectProxy, ObjectProxy
from .obj.scenario import Bucket, dump_bucket, load_bucket
from .obj.stage import Router, Stage
from .util.iter import iter_chunk
from .util.log import Log
from .util.mapping import get_keys, recursivelyUpdateDictList
from .util.prng import prng
from .util.redis import redis_client

_log = Log('stages')

_pipeline_map = {
    'main': MainPipeline,
    'test': TestPipeline,
    'check': CheckPipeline,
    'worker': WorkerPipeline,
    'controller': ControllerPipeline,
    'standalone': StandAlonePipeline
}


def register_stage(stage = None, pipeline = 'main'):
    def inner(cls):
        if isinstance(pipeline, list):
            for p in pipeline:
                _pipeline_map[p].Register(cls)
            _log.debug('Registered stage %s to pipeline %s'%(cls.__name__, ', '.join(pipeline)))
        else:
            _pipeline_map[pipeline].Register(cls)
            _log.debug('Registered stage %s to pipeline %s'%(cls.__name__, pipeline))
        return cls
    if stage is None:
        return inner
    else:
        return inner(stage)

@register_stage
class ExecuteModeRouter(Stage):
    def __init__(self):
        super().__init__()
        self._workerpipe = WorkerPipeline
        self._contlrpipe = ControllerPipeline
        self._standalonepipe = StandAlonePipeline

    def Execute(self, msg):
        if msg.mode == 'worker':
            return self._workerpipe.Invoke(msg)
        elif msg.mode == 'controller':
            return self._contlrpipe.Invoke(msg)
        elif msg.mode == 'standalone':
            return self._standalonepipe.Invoke(msg)
        return msg

# Picks the scenario to test
@register_stage(pipeline=['controller', 'standalone'])
class PickScenarioStage(Stage):
    def Execute(self, env):
        env.scenario = prng.choice(list(self.scenarios.values()))
        # print(env.scenario)
        self.logger.info('%s scenario chosen for execution'%env.scenario.name)
        return env

# Picks the backends for use with the required buckets
@register_stage(pipeline=['controller', 'standalone'])
class PickBackendStage(Stage):
    def Execute(self, env):
        for bucket_conf in env.scenario.required.buckets:
            # Gen a random name
            name = uuid.uuid4().hex
            # Choose the backend type
            if bucket_conf.transient: # Transient source requires a zenko bucket
                backend_type = constant.BackendType.ZNK
            else:
                available_backends = self.backends.types() if not bucket_conf.clouds else bucket_conf.clouds
                backend_type = prng.choice(available_backends)
            # Choose a backend of backend_type
            backend = prng.choice(self.backends.list_backends(backend_type=backend_type))
            # Build our client and create the bucket in Zenko
            bucket_client = s3.build_bucket(env.zenko, name)
            if not s3.create_bucket(bucket_client, backend):
                raise StopProcessingError('Failed to create bucket %s with backend %s'%(name, backend.name))
            # Update our conf and save it
            bucket = bucket_conf._replace(client=bucket_client, backend=backend, name=name)
            env.buckets.append(bucket)
            self.logger.debug('Created bucket %s with backend %s'%(bucket.name, backend.name))
        return env

# Picks the backends to be used for replication
@register_stage(pipeline=['controller', 'standalone'])
class PickReplicationStage(Stage):
    def Execute(self, env):
        buckets = []
        for bucket in env.buckets:
            if bucket.replication is not None and bucket.replication is not False:
                if isinstance(bucket.replication, list):
                    available_types = bucket.replication
                else:
                    available_types = bucket.clouds
                # self.logger.debug(available_types)
                if not available_types:
                    raise StopProcessingError('Unable to enable replication for %s! No available backends!'%bucket.name)
                backend_type = prng.choice(available_types)
                replication_backend = prng.choice(self.backends.list_backends(
                                                    backend_type=backend_type,
                                                    ignore_name=bucket.backend.name))
                b = bucket._replace(replication=replication_backend)
                buckets.append(b)
            else:
                buckets.append(bucket)
        env.buckets = buckets
        return env

# Enables versioning if required or needed for replication
@register_stage(pipeline=['controller', 'standalone'])
class EnableVersioningStage(Stage):
    def Execute(self, env):
        for bucket in env.buckets:
            if bucket.versioning or bucket.replication is not None:
                if bucket.backend.type == constant.BackendType.GCP or bucket.backend.type == constant.BackendType.AZR:
                    _log.warn('Versioning is not supported on GCP or Azure backends, skipping')
                    continue
                _log.debug('Enabling versioning for %s'%bucket.name)
                if not s3.enable_versioning(bucket.client):
                    raise StopProcessingError(
                        'Failed to enable versioning for %s'%bucket.name)
        return env

# Enable replication for buckets requiring it
@register_stage(pipeline=['controller', 'standalone'])
class EnableReplicationStage(Stage):
    def Execute(self, env):
        for bucket in env.buckets:
            if bucket.replication is not None and bucket.replication is not False:
                if bucket.backend.type == constant.BackendType.GCP or bucket.backend.type == constant.BackendType.AZR:
                    raise StopProcessingError('GCP or Azure can not be replication sources as they do to not supporting versioning!')
                _log.debug('Enabling replication %s %s -> %s'%(bucket.name, bucket.backend.name, bucket.replication.name))
                if not s3.setup_replication(bucket.client, bucket.replication.name):
                    raise StopProcessingError(
                        'Failed to enable replication %s %s -> %s'%(bucket.name, bucket.backend.name, bucket.replication.name))
        return env

# Enable Lifecycle expiration for buckets requiring it
@register_stage(pipeline=['controller', 'standalone'])
class EnableExpirationStage(Stage):
    pass

@register_stage(pipeline=['controller', 'standalone'])
class ResolveObjectStage(Stage):
    def Execute(self, env):
        obj_conf_defaults = [get_keys(t.conf, 'objects') for t in env.scenario.tests]
        obj_conf_scenario = get_keys(env.scenario.kwargs, 'objects')
        obj_conf = recursivelyUpdateDictList(*obj_conf_defaults, obj_conf_scenario)
        obj_conf = {k:v for k, v in obj_conf.items() if v is not None}
        for bucket in env.buckets:
            if obj_conf:
                env.objects.append(ObjectProxy(env.zenko, bucket.name,
                    **obj_conf['objects']))
            else:
                env.objects.append(ObjectProxy(env.zenko, bucket.name))
        return env

# Add a subpipeline for operation execution
@register_stage(pipeline='standalone')
class ExecuteTestsStage(Router):
    _PIPELINE = TestPipeline
    def Execute(self, env):
        for test in env.scenario.tests:
            test_env = Environment(
                            op=test,
                            buckets=env.buckets,
                            objects=env.objects,
                            scenario=env.scenario
                        )
            self.Route(test_env)
        return env


@register_stage(pipeline='controller')
class SubmitTestStage(Stage):
    def _build_work(self, env):
        for test in env.scenario.tests:
            for bucket_conf, oproxy in zip(env.buckets, env.objects):
                for bucket, key, size in oproxy.raw:
                    yield dict(
                            **test._asdict(),
                            bucket=bucket,
                            key=key,
                            size=size,
                            type='test',
                            bucket_conf=dump_bucket(bucket_conf)
                            )

    def Execute(self, env):
        self.logger.debug('Enqueing work for execution')
        for ops in iter_chunk(self._build_work(env), chunksize=100):
            env.task_queue.put(*ops)
        return env

@register_stage(pipeline='controller')
class WaitForCompletionStage(Stage):
    def Execute(self, env):
        self.logger.info('Waiting for work completion')
        while True:
            left = env.task_queue.wait_until_done(timeout=60)
            if left is True:
                break
            self.logger.info('Waiting for work completion, %i remaining'%left)
        return env

@register_stage(pipeline='controller')
class CheckWorkSuccessStage(Stage):
    def Execute(self, env):
        failed = False
        for task, result in env.results_queue.get_iter(block=False):
            if result is not True:
                env.failed_tests.append(
                    (
                        register.get_op(task.type, task.name),
                        load_bucket(task.bucket_conf),
                        FakeObjectProxy(env.zenko, task.bucket, task.key, task.size)
                    ))
                _log.error('Task %s has failed to complete!'%(task.name))
                failed = True
        if failed:
            raise StopProcessingError('Task %s has failed to complete!'%(task,))
        _log.debug('All work has finished successfully')
        return env

# @register_stage(pipeline='controller')
# class SubmitCheckStage(Stage):
#     def _build_work(self, env):
#         for check in env.scenario.checks:
#             for oproxy in env.objects:
#                 for bucket, key, size in oproxy.raw:
#                     yield dict(**check._asdict(), bucket=bucket, key=key, size=size, type='check')

#     def Execute(self, env):
#         self.logger.debug('Enqueing work for execution')
#         for ops in iter_chunk(self._build_work(env)):
#             env.task_queue.put(*ops)
#         return env

@register_stage(pipeline=['standalone', 'controller'])
class CheckTestStage(Router):
    _PIPELINE = CheckPipeline
    def Execute(self, env):
        failed = False
        for check in env.scenario.checks:
            check_env = Environment(
                op=check,
                buckets=env.buckets,
                objects=env.objects,
                scenario=env.scenario
            )
            self.Route(check_env)
            if check_env.StopProcessing:
                self.logger.error('Check %s failed!'%check_env.op.name)

                env.failed_checks.append((check_env.op, check_env.failure_args))
                failed = True
            else:
                self.logger.debug('Check %s completed successfully'%check_env.op.name)
        if failed:
            raise StopProcessingError('Check %s failed!'%check_env.op.name)
        self.logger.info('%s scenario has completed successfully'%env.scenario.name)
        return env


# No need to redefine this stage, just register it again
# register_stage(WaitForCompletionStage, pipeline='controller')
# register_stage(CheckWorkSuccessStage, pipeline='controller')



@register_stage(pipeline='test')
class ExecuteTestSubStage(Stage):
    def Execute(self, env):
        for b, o in zip(env.buckets, env.objects):
            self.logger.debug('Executing test %s'%env.op.name)
            ret = env.op.func(b, o, **env.op.kwargs)
            if not ret and env.op.conf.get('retry', False):
                raise RetryError('Test failed! Retrying %s'%(env.op.name))
            elif not ret:
                raise StopProcessingError('Test %s failed to complete!'%(env.op.name))
        return env


@register_stage(pipeline='check')
class ExecuteCheckSubStage(Stage):
    def Execute(self, env):
        self.logger.debug('Executing Check %s'%env.op.name)
        for b, o, c in zip(env.buckets, env.objects, env.scenario.required.buckets):
            ret = env.op.func(b, o, **env.op.kwargs)
            if not ret and env.op.conf.get('retry', False):
                raise RetryError('Check failed! Retrying %s'%(env.op.name))
            elif not ret:
                env.failure_args = (b, o)
                raise StopProcessingError('Check %s failed to complete!'%(env.op.name))

@register_stage(pipeline=['controller', 'standalone'])
class RemoveRedisKeysStage(Stage):
    def _make_keys(self, cloud, keys):
        for bucket, key in keys:
            yield '%s:%s:%s'%(bucket, key, cloud)

    def Execute(self, env):
        for bucket, objects in zip(env.buckets, env.objects):
            for chunk in iter_chunk(
                            self._make_keys(
                                bucket.backend.type.friendly(),
                                objects.objects),
                            chunksize=100):
                redis_client.delete(*chunk)
        return env

@register_stage(pipeline=['controller', 'standalone'])
class CleanupBucketStage(Stage):
    def Execute(self, env):
        for bucket in env.buckets:
            bucket.client.object_versions.all().delete()
            bucket.client.delete()
        return env



@register_stage(pipeline='worker')
class WaitForTaskStage(Router):
    _PIPELINE = TestPipeline
    def Execute(self, env):
        for done, task in env.task_queue.get_iter():
            print(task)
            self.logger.debug('Got task for execution %s'%(task,))
            task_env = Environment(
                op=register.get_op(task.type, task.name),
                buckets=[load_bucket(task.bucket_conf)],
                objects=[FakeObjectProxy(env.zenko, task.bucket, task.key, task.size)]
            )
            self.Route(task_env)
            env.results_queue.put(task, not env.StopProcessing)
            done()
        return env
