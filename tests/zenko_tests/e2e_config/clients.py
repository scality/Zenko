import os
import boto3

STS_ENDPOINT = os.getenv("STS_ENDPOINT")
session = boto3.session.Session()

stsclient = session.client(
    service_name='sts',
    endpoint_url=STS_ENDPOINT,
)
