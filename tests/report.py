#!/usr/bin/env python2

import argparse
import cookielib
import json
import os
import sys
import time
import urllib2
import random
from collections import defaultdict
import itertools
import re
import urlparse
from pprint import pprint
random.seed()

BUILD_NAME = os.environ.get('BUILD_NAME')
BUILD_NUMBER = os.environ.get('BUILD_NUMBER')
BUILD_REPO = os.environ.get('BUILD_REPO')
BUILD_STAGE = os.environ.get('BUILD_STAGE')
BUILD_MSG_TS = os.environ.get('BUILD_MSG_TS')

BUILD_BRANCH = 'development/1.1'

SLACK_TOKEN = os.environ.get('SLACK_TOKEN', '')
EVE_TOKEN = os.environ.get('EVE_TOKEN', '')

EVE_BASE_URL = 'https://eve.devsca.com/github/scality/%s'
AUTH_FRAGMENT = '/auth/login?token=%s'
API_FRAGMENT = '/api/v%d/%s'

EVE_URL = EVE_BASE_URL%BUILD_REPO

SLACK_API_BASE = 'https://slack.com/api/%s'
# SLACK_CHAN = 'CFYM0GWJ0' # Dev channel
SLACK_CHAN = 'CFCCE4X7F' # sf-devops

def get_args():
    parser = argparse.ArgumentParser(
        prog=sys.argv[0],
        description='Tool to enable slack build notifications in eve')
    parser.add_argument('-n', '--notify', action='store_true', help='Send a build start notification to slack')
    parser.add_argument('-t', '--trigger', action='store_true', help='Force start trigger-report stage for collecting results')
    parser.add_argument('-r', '--report', action='store_true', help='Update slack notification with build status')
    return parser.parse_args()

args = get_args()

def poll(msg='Got None, sleeping and trying again'):
    def outer(f):
        def inner(*args, **kwargs):
            while True:
                ret = f(*args, **kwargs)
                if ret is not None:
                    return ret
                print msg
                time.sleep(1)
        return inner
    return outer

def build_url(fragment, data = None):
    url = EVE_URL + fragment
    if data is not None:
        return url%data
    return url

class EveClient:
    def __init__(self, token):
        self._token = token
        self._session = None

    def _authenticate(self):
        print 'Authenticating to Eve...'
        cj = cookielib.CookieJar()
        url = build_url(AUTH_FRAGMENT, (self._token,))
        req = urllib2.Request(url)
        sesh = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj))
        sesh.open(req)
        return sesh

    @property
    def session(self):
        if self._session is None:
            self._session = self._authenticate()
        return self._session

    def _request(self, session, ep, payload={}, jsonrpcmethod = None, method = 'GET', is_json=True):
        data = {
        'id': 999,
        'jsonrpc': '2.0',
        'params': payload
        }
        headers = {
            'Content-Type': 'application/json'
        }
        if jsonrpcmethod is not None:
            data['method'] = jsonrpcmethod
        url = build_url(API_FRAGMENT, (2, ep))
        req = urllib2.Request(url, data=json.dumps(data))
        req.add_header('Content-Type', 'application/json')
        req.get_method = lambda: method.upper()
        try:
            res = session.open(req)
        except urllib2.HTTPError as excp:
            print str(excp)
            return {'error':True}
        if is_json:
            return json.loads(res.read())
        return res.read()

    def __call__(self, *args, **kwargs):
        return self._request(self.session, *args, **kwargs)

    def check_status(self, buildnum=None, buildid=None):
        if buildid is not None:
            uri = '/builds/%s'%buildid
        elif buildnum is not None:
            uri = 'builders/bootstrap/builds/%s'%buildnum
        resp = eve(uri)
        build = resp['builds'][0]
        if not build['complete']:
            return  None
        return build['state_string'] == 'build successful'

    def trigger_build(self):
        resp = self(
                'forceschedulers/force',
                payload=dict(
                    branch=BUILD_BRANCH,
                    force_stage=BUILD_STAGE,
                    prop00_name='report_build_number',
                    prop00_value=BUILD_NUMBER,
                    prop01_name='report_build_name',
                    prop01_value=BUILD_NAME,
                    prop02_name='report_build_msg_ts',
                    prop02_value=BUILD_MSG_TS
                ),
                jsonrpcmethod='force',
                method='POST'
            )
        return resp.get('result', [None])[0]

    def bid_from_brid(self, brid):
        resp = self('/buildrequests/%s/builds'%brid)
        return resp.get('builds', [{}])[0].get('buildid')

    def get_stage_info(self, buildid=None, buildnum=None):
        if buildid is not None:
            uri = '/builds/%s?property=stage_name&property=buildnumber'%buildid
        elif buildnum is not None:
            uri = 'builders/bootstrap/builds/%s?property=stage_name&property=buildnumber'%buildnum
        resp = self(uri)
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
        resp = self(uri)
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

    def extract_failure(self, buildnum, step_num):
        resp = self('/builds/%s/steps/%s/logs'%(buildnum, step_num))
        if resp.get('logs'):
            log = resp.get('logs')[0]
            resp = eve('/logs/%s/raw'%log.get('logid'), is_json=False)
            if resp:
                for error in itertools.chain(
                    self.pytest_failures(resp),
                    self.mocha_failures(resp)):
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
            'ts': self._main_ts,
            'as_user': True
        }
        success, resp = slack('chat.update', **data)
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
            stage_link = EVE_BASE_URL%BUILD_REPO + '#/builders/%s/builds/%s'%(
                builderid, buildnum)
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
        bm = BuildMessage(SLACK_CHAN)
        msg_ts = bm.post_start(BUILD_NAME, BUILD_NUMBER)
        if msg_ts is not None:
            print str(msg_ts)
        else:
            print ''
        sys.exit(0)

    eve = EveClient(EVE_TOKEN)
    if args.trigger:
        print 'Triggering monitor build...'
        if eve.trigger_build() is not None:
            print 'Monitor build started successfully.'
        else:
            print 'Monitor build failed to start!'
    elif args.report:
        print 'Waiting for build %s to finish...'%BUILD_NUMBER
        status = eve.check_status(buildnum=BUILD_NUMBER)
        print 'Build %s has finished'%BUILD_NUMBER
        bm = BuildMessage(SLACK_CHAN, BUILD_MSG_TS)
        if status:
            bm.post_success()
        else:
            failed_tests = defaultdict(list)
            for stage, step in eve.walk_steps(BUILD_NUMBER):
                if not step['results'] == 0:
                    for err in eve.extract_failure(step['buildid'], step['number']):
                        failed_tests[stage].append(err)
            bm.post_failure()
            bm.report_failures(BUILD_NAME, BUILD_NUMBER, failed_tests)
        bm.update(BUILD_NAME, BUILD_NUMBER)
