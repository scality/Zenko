import os
import boto3

import pytest


@pytest.fixture(scope='session')
def client():
    endpoint_url = os.environ['CLOUDSERVER_FRONT_ENDPOINT']
    return boto3.client(
        service_name='s3',
        endpoint_url=endpoint_url,
    )


@pytest.mark.nondestructive
@pytest.mark.validation
def test_list_buckets(client):
    assert 'Buckets' in client.list_buckets()


@pytest.mark.validation
def test_create_bucket(client):
    response = client.create_bucket(Bucket='zenko-e2e')
    assert 'Location' in response
    client.delete_bucket(Bucket='zenko-e2e')
