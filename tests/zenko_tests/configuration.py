#!/usr/bin/env python

import logging
import os
import sys
import time

import yaml
import jwt
from bravado.client import SwaggerClient
from bravado.requests_client import RequestsClient
from bravado_core.spec import Spec
from kubernetes import client, config
from kubernetes.config.config_exception import ConfigException
from jsonschema import validate

from e2e_config import accounts, endpoints, locations, workflows, schema

logging.basicConfig(level=logging.INFO)
_log = logging.getLogger("end2end configuration")


def load_k8s_config(config_file):
    """
    Loads K8S config.

    :param config_file: Name of the kube-config file.
    """
    try:
        config.load_incluster_config()
        return
    except:
        _log.info("unable to load incluster config")

    try:
        config.load_kube_config(config_file=config_file)
        return
    except:
        _log.info("unable to load k8s config file")

    raise Exception("Failed to load k8s config")


def load_end2end_config(config_file):
    """
    Loads end-to-end test setup file

    :param config_file: Name of the end-to-end config file.
    """
    with open(config_file) as file:
        return yaml.full_load(file)


def create_swagger_client(swagger_conf_url, api_url, token=""):
    """
    Create swagger client

    :param swagger_conf_url: url to swagger.conf
    :param api_url:
    :param token: jwt string
    """
    # to view available clients
    # print(dir(client))

    # to use a client
    # ui_client = client.ui_facing

    # to list methods available
    # print(dir(client.ui_facing))

    # describe method
    # print(client.ui_facing.createConfigurationOverlayUser.__doc__)

    # to view list of models for request/response
    # for model in client.swagger_spec.definitions:
    #     print(model)

    # retrieve model for request/response
    # client.get_model('user-v1')

    # print the properties of the model
    # print(client.get_model('user-v1').__doc__)

    if api_url.startswith("http://"):
        api_url = api_url.lstrip("http://")
    elif api_url.startswith("https://"):
        api_url = api_url.lstrip("https://")

    http_client = RequestsClient()
    http_client.set_api_key(api_url,
                            token,
                            param_name="X-Authentication-Token",
                            param_in="header")
    client = SwaggerClient.from_url(swagger_conf_url, http_client=http_client)

    return client


def main():
    TOKEN = os.getenv("TOKEN")
    UUID = os.getenv("UUID")
    KUBECONFIG = os.getenv("KUBECONFIG")
    CONFIG_FILE = os.getenv("CONFIG_FILE", "./e2e-config.yaml")
    MANAGEMENT_ENDPOINT = os.getenv("MANAGEMENT_ENDPOINT",
                                    "http://managementapi.zenko.local")
    MANAGEMENT_ENDPOINT = MANAGEMENT_ENDPOINT.rstrip('/')
    NAMESPACE = os.getenv("NAMESPACE", "default")

    try:
        load_k8s_config(config_file=KUBECONFIG)
        e2e_config = load_end2end_config(config_file=CONFIG_FILE)

        validate(e2e_config, yaml.full_load(schema.e2e_config_schema))

        client = create_swagger_client(MANAGEMENT_ENDPOINT + "/swagger.json",
                                       MANAGEMENT_ENDPOINT,
                                       token=TOKEN)

        for account in e2e_config["accounts"]:
            accounts.create_account(client,
                                    TOKEN,
                                    UUID,
                                    account,
                                    namespace=NAMESPACE)

        for endpoint in e2e_config["endpoints"]:
            endpoints.create_endpoint(client, UUID, endpoint)

        for location in e2e_config["locations"]:
            locations.create_location(client, UUID, location)

        for wf in e2e_config["workflows"]["replication"]:
            workflows.create_replication_workflow(client, UUID, wf)

        for wf in e2e_config["workflows"]["lifecycle"]:
            workflows.create_lifecycle_workflow(client, UUID, wf)

        for wf in e2e_config["workflows"]["ingestion"]:
            workflows.create_ingestion_workflow(client, UUID, wf)

    except Exception as e:
        _log.error("Unable to run set up: %s", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
