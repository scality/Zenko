import re
import xml.etree.ElementTree as ET

import requests
import pytest

from ..fixtures import *


@pytest.mark.conformance
def test_set_metadata(empty_object, testfile):
    util.mark_test('SET METADATA')
    assert empty_object.put(
        Body=testfile,
        Metadata=conf.METADATA_EXAMPLE
    )


@pytest.mark.conformance
def test_get_metadata(metadata_object):
    util.mark_test('GET METADATA')
    print(metadata_object.bucket_name, metadata_object.key)
    resp = metadata_object.get()
    assert resp
    assert 'Metadata' in resp
    for key, value in conf.METADATA_EXAMPLE.items():
        assert key in resp['Metadata']
        assert resp['Metadata'].get(key, None) == value


@pytest.mark.conformance
def test_set_get_metadata(empty_object, testfile):
    util.mark_test('SET & GET METADATA')
    empty_object.put(
        Body=testfile,
        Metadata=conf.METADATA_EXAMPLE
    )
    resp = empty_object.get()
    assert resp
    assert 'Metadata' in resp
    for key, value in conf.METADATA_EXAMPLE.items():
        assert key in resp['Metadata']
        assert resp['Metadata'].get(key, None) == value


def get_xml_namespace(elem):
    match = re.match(r'\{.*\}', elem.tag)
    return match.group(0) if match else ''


@pytest.mark.conformance
def test_metadata_search(metadata_multi, s3auth):
    util.mark_test('SEARCH METADATA')
    obj1, obj2 = metadata_multi
    base = conf.ZENKO_ENDPOINT + '/%s/?search=x-amz-meta-%s=%s'
    req1 = base % (obj1.bucket_name, 'color', conf.METADATA_EXAMPLE['color'])
    req2 = base % (obj1.bucket_name, 'flavor', conf.METADATA_EXAMPLE['flavor'])
    print(req1, req2)
    # This should return only the first object
    resp = requests.get(req1, auth=s3auth, verify=conf.VERIFY_CERTIFICATES)
    parsed = ET.fromstring(resp.text)
    namespace = get_xml_namespace(parsed)
    for result in parsed.findall(namespace + 'Contents'):
        key = result.find(namespace + 'Key').text
        assert key == obj1.key and not key == obj2.key
    # This should return both
    resp = requests.get(req2, auth=s3auth)
    parsed = ET.fromstring(resp.text)
    namespace = get_xml_namespace(parsed)
    for result in parsed.findall(namespace + 'Contents'):
        key = result.find(namespace + 'Key').text
        assert key == obj1.key or key == obj2.key
