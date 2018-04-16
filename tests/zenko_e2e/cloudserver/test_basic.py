import pytest


@pytest.mark.nondestructive
@pytest.mark.conformance
def test_list_buckets(zenko_s3_client):
    assert 'Buckets' in zenko_s3_client.list_buckets()


@pytest.mark.conformance
def test_create_bucket(zenko_s3_client):
    response = zenko_s3_client.create_bucket(Bucket='zenko-e2e')
    assert 'Location' in response
    zenko_s3_client.delete_bucket(Bucket='zenko-e2e')
