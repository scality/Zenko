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

        _log.info("location created: %s" % location["name"])
    except Exception as e:
        raise Exception(
            "Failed to create location '%s': %s" % (location["name"], e))

def delete_location(client, uuid, location):
    """
    Deletes a location
    :param client: swagger client
    :param uuid: zenko instance uuid
    :param location: location details
    """
    try:
        res = (
            client.ui_facing
            .deleteConfigurationOverlayLocation(locationName=location["name"], uuid=uuid)
            .response()
            .result
        )

        _log.info("location deleted")
    except Exception as e:
        raise Exception(
            "Failed to delete location '%s': %s" % (location["name"], e))
