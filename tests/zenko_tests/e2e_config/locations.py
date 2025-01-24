#!/usr/bin/env python

import logging
import os

_log = logging.getLogger("end2end configuration")

def create_location(client, uuid, location):
    """
    Creates a location
    :param client: swagger client
    :param uuid: zenko instance uuid
    :param location: location details
    """
    
    ENABLE_RING_TESTS = os.environ['ENABLE_RING_TESTS']
    if ENABLE_RING_TESTS == "false" and location["locationType"] == "location-scality-ring-s3-v1":
        return
    
    try:
        Location_V1 = client.get_model('location-v1')
        if "bootstrapList" not in location["details"]:
            location["details"]["bootstrapList"] = []
        loc = Location_V1(name=location["name"],
                            locationType=location["locationType"],
                            details=location["details"])

        res = (
            client.ui_facing
            .createConfigurationOverlayLocation(location=loc, uuid=uuid)
            .response()
            .result
        )

        _log.info("location created")
    except Exception as e:
        raise Exception(
            "Failed to create location '%s': %s" % (location["name"], e))
