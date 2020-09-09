.. _`Get CRR Status`:

Get CRR Status
==============

This GET request checks whether cross-region replication is enabled for all
locations configured as destination replication endpoints.

Request
-------

.. code::

   GET /_/backbeat/api/crr/status

Response
--------

.. code::

  {
    "location1": "disabled",
    "location2": "enabled"
  }
