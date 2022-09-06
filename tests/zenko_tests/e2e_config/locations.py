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
            "Failed to create location '%s': %s" % (str(location), e))
