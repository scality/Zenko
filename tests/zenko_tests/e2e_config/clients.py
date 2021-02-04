import os
import boto3

VAULT_ENDPOINT = os.getenv("VAULT_ENDPOINT")
session = boto3.session.Session()

stsclient = session.client(
    service_name='sts',
    endpoint_url=VAULT_ENDPOINT,
)
