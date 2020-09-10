#!/usr/bin/env python

e2e_config_schema = """
type: object
properties:
    accounts:
        type: array
        items:
            type: string
    endpoints:
        type: array
        items:
            type: object
            properties:
                host:
                    type: string
                locationName:
                    type: string
    locations:
        type: array
        items:
            type: object
            properties:
                name:
                    type: string
                locationType:
                    type: string
    workflows:
        type: object
        properties:
            replication:
                type: array
                items:
                    type: object
            lifecycle:
                type: array
                items:
                    type: object
            ingestion:
                type: array
                items:
                    type: object
"""

