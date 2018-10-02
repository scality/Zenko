from pipewrench import Message

from ..util.prng import prng


class Environment(Message):
    def __init__(self, *args, **kwargs):
        self.scenario = None
        self.buckets = []
        self.objects = []
        self.failed_checks = []
        self.failed_tests = []
        super().__init__(*args, **kwargs)

    @property
    def success(self):
        return not self.StopProcessing
