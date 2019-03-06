#!/usr/bin/env python2

import argparse
import cookielib
import json
import os
import sys
import time
import urllib2
import random

random.seed()

BUILD_NAME = os.environ.get('BUILD_NAME')
BUILD_NUMBER = os.environ.get('BUILD_NUMBER')
BUILD_REPO = os.environ.get('BUILD_REPO')
BUILD_STAGE = os.environ.get('BUILD_STAGE')
BUILD_MSG_TS = os.environ.get('BUILD_MSG_TS')

# print '%s %s %s'%(BUILD_NAME, BUILD_NUMBER, BUILD_REPO)

# BUILD_NAME = 'Nightly FooBar Showdown'
# BUILD_NUMBER = '5466'
# BUILD_REPO = 'zenko'

# BUILD_STAGE = 'report-test'
BUILD_BRANCH = 'development/1.1'
BUILD_BRANCH = 'feature/PIPDEP-721_Move_nightlies_to_releng'

SLACK_TOKEN = os.environ.get('SLACK_TOKEN', '')
EVE_TOKEN = os.environ.get('EVE_TOKEN', '')


# print '%s %s'%(len(SLACK_TOKEN), len(EVE_TOKEN))



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

def authenticate(token):
    print 'Authenticating to Eve...'
    cj = cookielib.CookieJar()
    url = build_url(AUTH_FRAGMENT, (token,))
    req = urllib2.Request(url)
    sesh = urllib2.build_opener(urllib2.HTTPCookieProcessor(cj))
    sesh.open(req)
    return sesh

def eve_request(session, ep, payload={}, jsonrpcmethod = None, method = 'GET'):
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
        return {}
    return json.loads(res.read())

def trigger_build(session):
    resp = eve_request(
                session,
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

@poll('Waiting for build to finish....')
def check_status(session, build_num):
    resp = eve_request(
                session,
                '/builders/bootstrap/builds/%s'%build_num,
                method='GET'
            )
    build = resp['builds'][0]
    if not build['complete']:
        return  None
    return build['state_string'] == 'build successful'

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

    def update(self, title, num, msg):
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

if __name__ == '__main__':
    if args.notify:
        bm = BuildMessage(SLACK_CHAN)
        msg_ts = bm.post_start(BUILD_NAME, BUILD_NUMBER)
        if msg_ts is not None:
            print str(msg_ts)
        else:
            print ''
        sys.exit(0)

    print '"%s" "%s" "%s" "%s" "%s"'%(BUILD_NAME, BUILD_NUMBER, BUILD_REPO, BUILD_STAGE, BUILD_MSG_TS)
    print '%s %s'%(len(SLACK_TOKEN), len(EVE_TOKEN))

    if args.trigger:
        sesh = authenticate(EVE_TOKEN)
        print 'Triggering monitor build...'
        trigger_build(sesh)
    elif args.report:
        sesh = authenticate(EVE_TOKEN)
        print 'Waiting for build %s to finish...'%BUILD_NUMBER
        status = check_status(sesh, BUILD_NUMBER)
        bm = BuildMessage(SLACK_CHAN, BUILD_MSG_TS)
        if status:
            msg = 'It passed!!!'
            bm.post_success()
        else:
            msg = 'It Failed!!!!!'
            bm.post_failure()
        bm.update(BUILD_NAME, BUILD_NUMBER, msg)
