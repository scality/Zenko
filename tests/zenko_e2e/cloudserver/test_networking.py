import socket

import requests
import requests.exceptions

import pytest


S3_ENDPOINTS = [
    's3.us-east-2.amazonaws.com',
    's3-us-east-2.amazonaws.com',
    # TODO Extend this list, based on
    # https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region
]


@pytest.mark.nondestructive
@pytest.mark.conformance
@pytest.mark.parametrize('s3_endpoint', S3_ENDPOINTS)
def test_resolve_s3_endpoint(s3_endpoint):
    try:
        socket.gethostbyname(s3_endpoint)
    except socket.gaierror as exc:
        # Note: we use xfail here because it *may* be fine for resolving to
        # fail in some very restricted networks.
        # However, we want to report this when running conformance or
        # nondestructive testing.
        pytest.xfail('Failed to resolve host: {!r}'.format(exc))


@pytest.mark.nondestructive
@pytest.mark.conformance
@pytest.mark.parametrize('s3_endpoint', S3_ENDPOINTS)
def test_tls_connect_s3_endpoint(s3_endpoint):
    try:
        requests.get('https://{}/'.format(s3_endpoint), verify=True)
    except socket.gaierror as exc:
        pytest.xfail('Failed to resolve host: {!r}'.format(exc))
    except requests.exceptions.ConnectionError as exc:
        pytest.xfail('Failed to connect to host: {!r}'.format(exc))
