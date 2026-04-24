#!/usr/bin/env python

import logging

_log = logging.getLogger("end2end configuration")

def create_endpoint(client, uuid, host, location):
    """
    Creates an endpoint for a location
    :param client: swagger client
    :param uuid: zenko instance uuid
    :param host: hostname
    :param location: location name
    """
    try:
        Endpoint_V1 = client.get_model('endpoint-v1')
        ep = Endpoint_V1(hostname=host, locationName=location)

        res = (
            client.ui_facing
            .createConfigurationOverlayEndpoint(endpoint=ep, uuid=uuid)
            .response()
            .result
        )

        _log.info(res)
        _log.info("endpoint created")
    except Exception as e:
        raise Exception(
            "Failed to create endpoint for location '%s': %s" % (location, e))
