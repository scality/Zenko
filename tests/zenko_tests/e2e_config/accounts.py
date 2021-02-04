#!/usr/bin/env python

import logging

from kubernetes import client, config
from kubernetes.client.rest import ApiException

from e2e_config import clients

_log = logging.getLogger("end2end configuration")

def get_credentials(token, account_id):
    """
    Retrieve credentials from sts service

    :param token: oidc id token
    :param account_id: account id
    """
    _log.info("getting account credentials")

    res = clients.stsclient.assume_role_with_web_identity(
        RoleArn="arn:aws:iam::%s:role/roleForB" % (account_id),
        RoleSessionName='end2end',
        WebIdentityToken=token,
        DurationSeconds=60 * 60, # 1 hr
    )

    return res


def create_account_secret(name, credentials, namespace="default"):
    """
    Create a k8s secret resource for account

    :param name: secret name
    :param credentials: sts assume role credentials
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
        string_data=credentials,
    )

    res = core.create_namespaced_secret(namespace, body=secret)

    _log.info("created account secret")


def create_account(client, token, uuid, account_name, namespace="default"):
    """
    Creates a user account and save its accessKey and secretKey as k8s secret

    :param client: swagger client
    :param uuid: zenko instance uuid
    :param account_name: account_name
    :param namespace: k8s namespace
    """
    try:
        User_V1 = client.get_model('user-v1')
        u = User_V1(userName=account_name,
                    email="%s@zenko.local" % (account_name))

        res = (
            client.ui_facing
            .createConfigurationOverlayUser(user=u, uuid=uuid)
            .response()
            .result
        )

        creds = get_credentials(token, res.id)
        create_account_secret(name="end2end-account-%s" % (res.userName),
                              credentials=creds["Credentials"],
                              namespace=namespace)

        _log.info("created account")
    except Exception as e:
        raise Exception(
            "Failed to create account '%s': %s" % (account_name, e))
