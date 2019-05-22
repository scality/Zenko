#!/usr/bin/env python2

import argparse
import cookielib
import itertools
import json
import os
import random
import re
import sys
import time
import urllib2
import urlparse
from collections import defaultdict

random.seed()

TRUTHY = [
	'true',
	'on',
	'yes',
	't',
	'enabled',
	'enable',
]

# Convert a env var to a boolean
def is_env_flag_set(key):
	val = os.environ.get(key, None)
	if val is None:
		return False
	return val.strip().lower() in TRUTHY

# Some constants
SLACK_API_BASE = 'https://slack.com/api/%s'
SLACK_CHAN_DEVOPS = 'CFCCE4X7F' #sf-devops
SLACK_CHAN_HIPPO = 'CFD81UFEK' #hippo
# SLACK_CHAN_DEVOPS = 'CFYM0GWJ0' #gab-dev  These dev channels should be left in,
# SLACK_CHAN_HIPPO = 'GH9RSSWKA' #gab-dev-2 so one doesn't have to look it up everytime

# Load info about this build run
BUILD_NAME = os.environ.get('BUILD_NAME')
BUILD_NUMBER = os.environ.get('BUILD_NUMBER')
BUILD_REPO = os.environ.get('BUILD_REPO')
BUILD_STAGE = os.environ.get('BUILD_STAGE')
BUILD_BRANCH = os.environ.get('BUILD_BRANCH')
# This is the timestamp of the initial slack message
# Which we use to update/emoji/reply to the message
BUILD_MSG_TS = os.environ.get('BUILD_MSG_TS')
if BUILD_MSG_TS is not None and BUILD_MSG_TS.strip() == '':
    BUILD_MSG_TS = None
# This tells us if failures should be crossposted
CROSSPOST_TO_HIPPO = is_env_flag_set('CROSSPOST_TO_HIPPO')

# And finally load our tokens
SLACK_TOKEN = os.environ.get('SLACK_TOKEN', '')
EVE_TOKEN = os.environ.get('EVE_TOKEN', '')

def get_args():
    parser = argparse.ArgumentParser(
        prog=sys.argv[0],
        description='Tool to enable slack build notifications in eve')
    parser.add_argument('-n', '--notify', action='store_true', help='Send a build start notification to slack')
    parser.add_argument('-t', '--trigger', action='store_true', help='Force start trigger-report stage for collecting results')
    parser.add_argument('-r', '--report', action='store_true', help='Update slack notification with build status')
    return parser.parse_args()

args = get_args()

class Retry(Exception):
    def __init__(self, err=None):
        super(Retry, self).__init__('Retry')
        self.err = err

def retry(msg, sleep=None, retries=3):
    def outer(f):
        def inner(*args, **kwargs):
            if retries == -1:
                _retries = itertools.count(0)
            else:
                _retries = range(retries + 1)
            for i in _retries:
                try:
                    return f(*args, **kwargs)
                except Retry as e:
                    print(msg.format(
                        err=str(e.err),
                        retry=i,
                        limit=retries
                    ))
                    if sleep:
                        time.sleep(sleep)
        return inner
    return outer

class EveClient:
    _BASE_URL = 'https://eve.devsca.com/github/scality/{repo}/{fragment}'
    _AUTH_FRAGMENT = 'auth/login?token={token}'
    _API_FRAGMENT = 'api/v{ver}/{path}'

    def __init__(self, repo, token, retries=0):
        self._repo = repo
        self._token = token
        self._retries = retries
        self._session = None

    def _build_url(self, fragment, data=None):
        url = self._BASE_URL.format(
            repo=self._repo,
            fragment=fragment,
        )
        if data is not None:
            return url.format(**data)
        return url

    def _authenticate(self):
        cj = cookielib.CookieJar()
        url = self._build_url(self._AUTH_FRAGMENT, {'token':self._token})
        req = urllib2.Request(url)
        sesh = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj))
        sesh.open(req)
        return sesh

    @property
    def session(self):
        if self._session is None:
            self._session = self._authenticate()
        return self._session


    def _request(self, session, url, payload, method = 'GET'):
        req = urllib2.Request(url, data=json.dumps(payload))
        req.add_header('Content-Type', 'application/json')
        req.get_method = lambda: method.upper()
        try:
            res = session.open(req)
        except urllib2.HTTPError as excp:
            return {'ok': False, 'err': excp}
        return {'ok': True, 'resp': res.read()}

    @retry('Request to Eve failed with error: {err}, Retrying {retry}/{limit}')
    def request(self, path, params={}, jsonrpcmethod=None, method='GET', is_json=True):
        data = {
            'id': 999,
            'jsonrpc': '2.0',
            'params': params
        }
        if jsonrpcmethod is not None:
            data['method'] = jsonrpcmethod
        url = self._build_url(self._API_FRAGMENT, {'ver':2, 'path':path})
        for i in range(self._retries + 1):
            resp = self._request(self.session, url, data, method=method)
            if resp.get('ok'):
                if is_json:
                    return True, json.loads(resp.get('resp'))
                return True, resp.get('resp')
            else:
                print 'Request to Eve failed with error {err}'.format(**resp)
        return False, None

    def get_build(self, build_number=None, build_id=None):
        if build_number is not None:
            uri = 'builders/bootstrap/builds/%s'%build_number
        if build_id is not None:
            uri = '/builds/%s'%build_id
        ok, resp = self.request(uri)
        return resp

    @retry('Waiting for build to finish...', retries=-1)
    def get_build_status(self, *args, **kwargs):
        resp = self.get_build(*args, **kwargs)
        if resp is not None:
            build = resp.get('builds', [None])[0]
            if build.get('complete'):
                return build.get('state_string') == 'build successful'
        raise Retry()

    @retry('Triggering report build failed with error: {err}, Retrying {retry}/{limit}')
    def trigger_build(self):
        ok, resp = self.request(
            'forceschedulers/force',
            jsonrpcmethod='force',
            method='POST',
            params=dict(
                branch=BUILD_BRANCH,
                force_stage=BUILD_STAGE,
                prop00_name='report_build_number',
                prop00_value=BUILD_NUMBER,
                prop01_name='report_build_name',
                prop01_value=BUILD_NAME,
                prop02_name='report_build_msg_ts',
                prop02_value=BUILD_MSG_TS,
                prop03_name='crosspost-to-hippo',
                prop03_value=str(CROSSPOST_TO_HIPPO)
            )
        )
        if not ok:
            raise Retry()
        brid = resp.get('result', [None])[0]
        if brid is None:
            raise Retry
        while True:
            bid = self.bid_from_brid(brid)
            if bid is not None:
                break
            print('Waiting for build id')
            time.sleep(5)
        return self.get_stage_info(buildid=bid)[1]

    def bid_from_brid(self, brid):
        ok, resp = self.request('/buildrequests/%s/builds'%brid)
        build = resp.get('builds')
        if build:
            return build[0].get('buildid')

    def get_stage_info(self, buildid=None, buildnum=None):
        if buildid is not None:
            uri = '/builds/%s?property=stage_name&property=buildnumber'%buildid
        elif buildnum is not None:
            uri = 'builders/bootstrap/builds/%s?property=stage_name&property=buildnumber'%buildnum
        ok, resp = self.request(uri)
        build = resp.get('builds', [{}])[0]
        props = build.get('properties', {})
        return  (
            build.get('builderid', 0),
            props.get('buildnumber', [0])[0],
            props.get('stage_name', [''])[0],
        )

    def walk_steps(self, buildnum=None, buildid=None):
        stage = self.get_stage_info(buildid=buildid, buildnum=buildnum)
        if buildnum is not None:
            uri = 'builders/bootstrap/builds/%s/steps'%buildnum
        elif buildid is not None:
            uri = 'builds/%s/steps'%buildid
        ok, resp = self.request(uri)
        for step in resp.get('steps', []):
            yield stage, step
            for url in step.get('urls', []):
                if 'buildrequests' in url['url']:
                    brid = urlparse.urlsplit(url['url']).fragment.split('/')[1]
                    bid = self.bid_from_brid(brid)
                    for stage_inner, step_inner in self.walk_steps(buildid=bid):
                        yield stage_inner, step_inner


    MOCHA_REGEX = re.compile(r'([0-9]{1,3}\)\sshould\s[\w ]+)')
    def mocha_failures(self, log):
        for match in self.MOCHA_REGEX.finditer(log):
            yield match.group(0)

    PYTEST_REGEX = re.compile(r'FAIL zenko_e2e\/([\w\/\.:\[\]]+)')
    def pytest_failures(self, log):
        for match in self.PYTEST_REGEX.finditer(log):
            yield match.group(1).replace('cloudserver/', '')


    VARIOUS_REGEX = tuple(re.compile(regex) for regex in [
        r'Unable to connect to the server: (dial tcp <openstack_cluster_ip>:6443: i/o timeout)',
        r'INFO:create_buckets:(Containers have not become ready[\w\s]+has elasped)'
    ])
    def various_failures(self, log):
        for regex in self.VARIOUS_REGEX:
            for match in regex.finditer(log):
                yield match.group(1)

    def extract_failure(self, buildnum, step_num):
        ok, resp = self.request('/builds/%s/steps/%s/logs'%(buildnum, step_num))
        if resp.get('logs'):
            log = resp.get('logs')[0]
            ok, resp = self.request('/logs/%s/raw'%log.get('logid'), is_json=False)
            if resp:
                for error in itertools.chain(
                    self.pytest_failures(resp),
                    self.mocha_failures(resp),
                    self.various_failures(resp),
                    ):
                    yield error


def slack(method, **kwargs):
    req = urllib2.Request(SLACK_API_BASE%method, data=json.dumps(kwargs))
    req.add_header('Content-Type', 'application/json')
    req.add_header('Authorization', 'Bearer %s'%SLACK_TOKEN)
    req.get_method = lambda: 'POST'
    try:
        res = urllib2.urlopen(req)
    except urllib2.HTTPError as excp:
        return False, None
    return True, json.load(res)

class BuildMessage:
    _start_template = ':{em}: Started {title} #{num}'
    _stop_template = ':{em}: {title} #{num} has finished.'
    _failure_title_template = ':fire: *Failures for {title} #{num}* :fire:'
    _success_emoji = '100'
    _failure_emoji = 'fire'

    def __init__(self, channel, ts = None):
        self._main_ts = ts
        self._channel = channel

    @property
    def _builder_emoji(self):
        return '%s-%s-worker'%(
            random.choice(['female', 'male']),
            random.choice(['factory', 'construction'])
        )

    def post_start(self, title, build_num):
        self._title = title
        self._build_num = build_num
        msg = self._start_template.format(
            title=title,
            num=build_num,
            em=self._builder_emoji
        )
        data = {
            'text': msg,
            'channel': self._channel
        }
        success, resp = slack('chat.postMessage', **data)
        if success:
            self._main_ts = resp['ts']
        return self._main_ts

    def post_success(self):
        if self._main_ts is not None:
            data = {
                'channel': self._channel,
                'timestamp': self._main_ts,
                'name': self._success_emoji
            }
            success, resp = slack('reactions.add', **data)
            return success
        return False

    def post_failure(self):
        if self._main_ts is not None:
            data = {
                'channel': self._channel,
                'timestamp': self._main_ts,
                'name': self._failure_emoji
            }
            success, resp = slack('reactions.add', **data)
            return success
        return False

    def update(self, title, num):
        data = {
            'text': self._stop_template.format(
                title=title,
                num=num,
                em=self._builder_emoji
            ),
            'channel': self._channel,
        }
        if self._main_ts is None:
            method = 'chat.postMessage'
        else:
            data['ts'] = self._main_ts,
            data['as_user'] = True
            method = 'chat.update'
        success, resp = slack(method, **data)
        print(success, resp)
        if success and self._main_ts is None:
            self._main_ts = resp['ts']
        return success

    def report_failures(self, title, num, failures):
        blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": self._failure_title_template.format(title=title, num=num),
                }
            },
            {"type": "divider"},
        ]
        for stage, tests in failures.items():
            builderid, buildnum, stage_name = stage
            stage_link = EveClient._BASE_URL.format(
                repo=BUILD_REPO,
                fragment='#/builders/%s/builds/%s'%(builderid, buildnum)
            )
            header = '*%s:*\n%s\n'%(stage_name, stage_link)
            blocks.append(
                {
                    'type': 'section',
                    'text': {
                        'type': 'mrkdwn',
                        'text': header + '\n'.join('`%s`'%x for x in tests) + '\n'
                    }
                }
            )
            blocks.append({'type':'divider'})
        msg = {
            'thread_ts': self._main_ts,
            'channel': self._channel,
            'blocks': blocks[:-1]
        }
        success, resp = slack('chat.postMessage', **msg)
        return success


if __name__ == '__main__':
    if args.notify:
        bm = BuildMessage(SLACK_CHAN_DEVOPS)
        msg_ts = bm.post_start(BUILD_NAME, BUILD_NUMBER)
        if msg_ts is not None:
            print str(msg_ts)
        else:
            print ''
        sys.exit(0)

    eve = EveClient(BUILD_REPO, EVE_TOKEN, retries=3)
    if args.trigger:
        print 'Triggering monitor build...'
        report_buildnum = eve.trigger_build()
        if report_buildnum is not None:
            print 'Monitor build #%s started successfully.'%report_buildnum
        else:
            print 'Monitor build failed to start!'
    elif args.report:
        print 'Waiting for build %s to finish...'%BUILD_NUMBER
        status = eve.get_build_status(build_number=BUILD_NUMBER)
        print 'Build %s has finished'%BUILD_NUMBER
        bm = BuildMessage(SLACK_CHAN_DEVOPS, BUILD_MSG_TS)
        bm.update(BUILD_NAME, BUILD_NUMBER)
        if status:
            bm.post_success()
        else:
            failed_tests = defaultdict(list)
            for stage, step in eve.walk_steps(BUILD_NUMBER):
                if not step['results'] == 0:
                    for err in eve.extract_failure(step['buildid'], step['number']):
                        failed_tests[stage].append(err)
            bm.post_failure()
            if CROSSPOST_TO_HIPPO:
                bm_hippo = BuildMessage(SLACK_CHAN_HIPPO)
                bm_hippo.update(BUILD_NAME, BUILD_NUMBER)
                bm_hippo.post_failure()
            if len(failed_tests):
                bm.report_failures(BUILD_NAME, BUILD_NUMBER, failed_tests)
                if CROSSPOST_TO_HIPPO:
                    bm_hippo.report_failures(BUILD_NAME, BUILD_NUMBER, failed_tests)
