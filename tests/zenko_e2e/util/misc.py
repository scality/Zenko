import uuid
import json


def make_name(name, nonce=None):
    if nonce is None:
        nonce = uuid.uuid4().hex
    return '%s-%s' % (name, nonce)


def format_json(tpl, as_string=True, **kwargs):
    conf = tpl.format(**kwargs)
    conf = json.loads(conf)
    if as_string:
        conf = json.dumps(conf)
    return conf


def mark_test(name):
    head = ' Starting %s ' % name
    print('\n' + '=' * 35 + head + '=' * 35, flush=True)


def remark(text):
    print('\n' + '=' * 35 + text + '=' * 35, flush=True)


def strip_proto(url):
    parts = url.split('//')
    if len(parts) > 1:
        return '//'.join(parts[1:])
    return parts[0]


def strip_port(url):
    parts = url.split(':')
    if len(parts) <= 2:
        return parts[0]
    return ':'.join(parts[:2])


def baseurl(url):
    return strip_port(strip_proto(url))
