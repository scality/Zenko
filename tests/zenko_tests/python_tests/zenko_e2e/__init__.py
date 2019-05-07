import logging

class Blacklist(logging.Filter):  # noqa pylint: disable=too-few-public-methods
    def __init__(self, *blacklist):  # pylint: disable=super-init-not-called
        self.blacklist = [logging.Filter(name) for name in blacklist]

    def filter(self, record):
        return not any(f.filter(record) for f in self.blacklist)


BLACKLIST = [
    'botocore.vendored.requests.packages.urllib3.connectionpool',
    'azure.storage.common.storageclient',
    'storageclient.py',
    'connectionpool.py',
]

for handler in logging.root.handlers:
    handler.addFilter(Blacklist(*BLACKLIST))
