#!/usr/bin/env python

import logging

_log = logging.getLogger("end2end configuration")

def create_location(client, uuid, location):
    """
    Creates a location
    :param client: swagger client
    :param uuid: zenko instance uuid
    :param location: location details
    """
    try:
        Location_V1 = client.get_model('location-v1')
        loc = Location_V1(name=location["name"],
                            locationType=location["locationType"],
                            details=location["details"])

        res = (
            client.ui_facing
            .createConfigurationOverlayLocation(location=loc, uuid=uuid)
            .response()
            .result
        )

        _log.info(res)
        _log.info("location created")
    except Exception as e:
        raise Exception(
            "Failed to create location '%s': %s" % (location["name"], e))
