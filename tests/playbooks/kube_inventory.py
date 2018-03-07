#!/usr/bin/env python

# Ansible dynamic inventory for kubernetes

#
# http://docs.ansible.com/ansible/latest/dev_guide/developing_inventory.html
#

import json
import argparse
import os
from kubernetes import client
from kubernetes import config


def list_machine(host=None):
    config.load_kube_config()
    api = client.CoreV1Api()

    namespace = os.environ.get('K8S_AUTH_NAMESPACE', 'default')

    pod_list = api.list_namespaced_pod(namespace=namespace).items

    result = {'_meta': {'hostvars': {}}, 'all': {'hosts': []}}

    # TODO: do something with host
    for pod in filter(None, pod_list):
        result['_meta']['hostvars'][pod.metadata.name] = {
            'ansible_connection': 'kubectl',
            'ansible_kubectl_namespace': namespace,
            'labels': pod.metadata.labels
        }
        result['all']['hosts'].append(pod.metadata.name)
    return result


def indent_json(obj):
    return json.dumps(obj, indent=True, separators=(',', ': '))


def main():
    parser = argparse.ArgumentParser('Kubernetes dynamic inventory')
    exclusion_parser = parser.add_mutually_exclusive_group(required=True)
    exclusion_parser.add_argument('--list', action='store_true')
    exclusion_parser.add_argument('--host')
    args = parser.parse_args()
    host = args.host
    if host:
        print(indent_json(list_machine(host=host)['_meta']['hostvars'][host]))
    else:
        print(indent_json(list_machine()))


if __name__ == '__main__':
    main()
