import uuid
import json

def make_name(name, nonce = None):
	if nonce is None:
		nonce = uuid.uuid4().hex
	return '%s-%s'%(name, nonce)


def format_json(tpl, asString = True, **kwargs):
	conf = tpl.format(**kwargs)
	conf = json.loads(conf)
	if asString:
		conf = json.dumps(conf)
	return conf


def mark_test(name):
	head = ' Starting %s '%name
	print('\n' + '=' * 35 + head + '=' * 35)

def remark(text):
	print('\n' + '=' * 35 + text + '=' * 35)


def pretty_print_POST(req):
    """
    At this point it is completely built and ready
    to be fired; it is "prepared".

    However pay attention at the formatting used in
    this function because it is programmed to be pretty
    printed and may differ from the actual request.
    """
    print('{}\n{}\n{}\n\n{}'.format(
        '-----------START-----------',
        req.method + ' ' + req.url,
        '\n'.join('{}: {}'.format(k, v) for k, v in req.headers.items()),
        req.body,
    ))


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
