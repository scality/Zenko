.. _`Get CRR Status for a Location`:

Get CRR Status for a Location
=============================

This GET request checks whether cross-region replication is enabled for a
specified location, configured as a destination replication endpoint.

Request
-------

.. code::

   GET /_/backbeat/api/crr/status/<location-name>

Response
--------

.. code::

  {
    "<location-name>": "enabled"
  }

