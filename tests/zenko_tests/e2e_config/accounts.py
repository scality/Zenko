#!/usr/bin/env python

import logging

from kubernetes import client, config
from kubernetes.client.rest import ApiException

_log = logging.getLogger("end2end configuration")


def create_account_secret(
    name, access_key, secret_key, namespace="default"
):
    """
    Create a k8s secret resource for account

    :param account_name: account name
    :param access_key: access key
    :param secret_key: secret key
    :param namespace: k8s namespace
    """
    _log.info("creating account secret")
    core = client.CoreV1Api()
    secret = client.V1Secret(
        api_version="v1",
        metadata=client.V1ObjectMeta(
            name=name,
            labels={
                "type": "end2end",
            },
        ),
        string_data={
            "accessKey": access_key,
            "secretKey": secret_key,
        },
    )

    res = core.create_namespaced_secret(namespace, body=secret)

    _log.info("created account secret")


def create_account(client, uuid, account_name, namespace="default"):
    """
    Creates a user account and save its accessKey and secretKey as k8s secret

    :param client: swagger client
    :param uuid: zenko instance uuid
    :param account_name: account_name
    :param namespace: k8s namespace
    """
    try:
        User_V1 = client.get_model('user-v1')
        u = User_V1(userName=account_name)

        res = (
            client.ui_facing
            .createConfigurationOverlayUser(user=u, uuid=uuid)
            .response()
            .result
        )

        _log.info("created account")

        create_account_secret(name="end2end-account-%s" % (res.userName),
                              access_key=res.accessKey,
                              secret_key=res.secretKey,
                              namespace=namespace)
    except Exception as e:
        raise Exception(
            "Failed to create account '%s': %s" % (account_name, e))
