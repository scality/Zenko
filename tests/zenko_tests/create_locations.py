#!/usr/bin/env python

import os
import logging
from e2e_config import locations
import configuration

logging.basicConfig(level=logging.INFO)
_log = logging.getLogger('create_locations')

TOKEN = os.getenv("TOKEN")
UUID = os.getenv("UUID")
CONFIG_FILE = os.getenv("CONFIG_FILE", "./e2e-config.yaml")
MANAGEMENT_ENDPOINT = os.getenv("MANAGEMENT_ENDPOINT",
                                "http://managementapi.zenko.local")
MANAGEMENT_ENDPOINT = MANAGEMENT_ENDPOINT.rstrip('/')

def create_locations():
    try:
        e2e_config = configuration.load_end2end_config(config_file=CONFIG_FILE)

        client = configuration.create_swagger_client(MANAGEMENT_ENDPOINT + "/swagger.json",
                                       MANAGEMENT_ENDPOINT,
                                       token=TOKEN)

        for location in e2e_config["locations"]:
            locations.create_location(client, UUID, location)
    except Exception as e:
        _log.error("Unable to create locations: %s", e)
        raise e

create_locations()
