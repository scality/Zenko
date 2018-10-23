import json
import os
import re
from collections import namedtuple

from mitmproxy import ctx
from redis import StrictRedis

from .redis import Request, complete_replication

REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
AWS_REGEX = re.compile(r'^https?://(?P<cloud_bucket>[a-z0-9-]+)\.(s3-|s3\.)?(.*)\.amazonaws\.com\/(?P<bucket>\w+)\/(?P<key>[\w\/\-]+)(?P<mpu_init>\?uploads)?(?P<part_upload>\?partNumber=(?P<part>\d+))?(?P<mpu_comp>\??uploadId=(?P<upload_id>[\w\.]+))?')
GCP_REGEX = re.compile(r'^https?://(?P<cloud_bucket>[a-z0-9-]+)\.storage\.googleapis\.com(?:\/(?P<bucket>\w+)\/(?P<key>[\w\/]+)(?:-\w{32}\/(?P<mpu_init>init$)?(?P<part_upload>parts\/(?P<part>\d+)$)?(?P<mpu_copy>(?:compose\/(?P<cpart>\d+)|final)(?:\?compose)?$)?)?(?P<mpu_comp>\?generation=\d{16}$)?)?')



class RedisRequestLogger:
    def __init__(self):
        self._redis = StrictRedis(host=REDIS_HOST)

    def _log_request(self, req):
        key = '%s:%s:%s'%(req.bucket, req.key, req.cloud)
        self._redis.rpush(key, json.dumps(req._asdict()))

    def responseheaders(self, flow):
        request = parse_flow(flow)
        if request and request.tag:
            ctx.log.info('%s'%str(request))
            if request.tag == 'mpu_comp' or request.tag == 'put':
                if request.status == 200:
                    ctx.log.info('Marking complete replication replication:%s:%s:%s'%(request.cloud, request.bucket, request.key))
                    complete_replication(request.bucket, request.key, request.cloud)
            self._log_request(request)



def extract_common(flow):
    return dict(
        method=flow.request.method,
        status=flow.response.status_code,
        url=flow.request.url,
        extra={'headers':dict(flow.response.headers.items())}
    )

def extract_match_common(match):
    return dict(
        cloud_bucket=match.group('cloud_bucket'),
        bucket=match.group('bucket'),
        key=match.group('key'),
    )

def get_common_tag(match):
    if match['mpu_init']:
        return 'mpu_init'
    elif match['part_upload']:
        return 'mpu_part'
    elif match['mpu_comp']:
        return 'mpu_comp'
    return None

def get_method_tag(request):
    if request.method == 'PUT':
        return 'put'
    elif request.method == 'HEAD':
        return 'head'
    elif request.method == 'DELETE':
        return 'delete'


def extract_aws(flow):
    data = dict(cloud='aws')
    data.update(extract_common(flow))

    match = AWS_REGEX.match(flow.request.url)
    if not match:
        return None
    data.update(extract_match_common(match))

    tag = get_common_tag(match)
    if tag == 'mpu_part':
        data['extra']['part'] = int(match['part'])
    if not tag:
        tag = get_method_tag(flow.request)
    data['tag'] = tag
    return data

def extract_gcp(flow):
    data = dict(cloud='gcp')
    data.update(extract_common(flow))

    match = GCP_REGEX.match(flow.request.url)
    if not match:
        return None
    data.update(extract_match_common(match))

    if match['mpu_copy']:
        tag = 'mpu_copy'
        if match['cpart']:
            data['extra']['part'] = int(match['cpart'])
        else:
            data['extra']['part'] = 0
    else:
        tag = get_common_tag(match)
    if tag == 'mpu_part':
        data['extra']['part'] = int(match['part'])
    if not tag:
        tag = get_method_tag(flow.request)
    data['tag'] = tag
    return data

def build_request(data):
    if data:
        return Request(**data)

def parse_flow(flow):
    cloud_match = None
    cloud = None
    if 'amazon' in flow.request.host:
        return build_request(extract_aws(flow))
    if 'google' in flow.request.host:
        return build_request(extract_gcp(flow))
