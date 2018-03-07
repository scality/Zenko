import pytest

# this defines the arguments that are processed by functional.py


def pytest_addoption(parser):
    parser.addoption("--s3cfg-source", action="store", default="~/.s3cfg.source",
                     help="s3cfg configuration file of the source environment containing access/secret keys")
    parser.addoption("--s3cfg-destination", action="store", default="~/.s3cfg.destination",
                     help="s3cfg configuration file of the destination environment containing access/secret keys")
    parser.addoption("--machine-source", action="store", default="node1",
                     help="machine on the source environment to send s3/vault queries - it must be a DNS name")
    parser.addoption("--machine-destination", action="store", default="node6",
                     help="machine on the destination environment to send s3/vault queries - it must be a DNS name")
    parser.addoption("--bucket-source", action="store", default="source",
                     help="name of the source bucket to use - it is supposed to exist and that replication is setup")
    parser.addoption("--bucket-destination", action="store", default="destination",
                     help="name of the destination bucket to use - it is supposed to exist and that replication is setup")
    parser.addoption("--sample-size", action="store", default="1000",
                     help="number of objects/operations to be carried out in each tests")
    parser.addoption("--object-name-size", action="store", default="512",
                     help="size of the object names")
    parser.addoption("--non-mpu-object-body-size", action="store", default="4096",
                     help="size of the data associated with an object that is not uploaded with multi part")
    parser.addoption("--mpu-part-size-mb", action="store", default="6",
                     help="part size for the mpu upload in MB")
