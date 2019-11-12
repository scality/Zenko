.. _`get progress`:

Get Progress
============

This route returns replication progress in bytes transferred for the specified
object.

Request
-------

.. code::

   GET /_/backbeat/api/metrics/crr/<location-name>/progress/<bucket>/<key>?versionId=<version-id>

Response
--------

.. code::

  {
    "description": "Number of bytes to be replicated (pending), number of bytes transferred to the destination (completed), and percentage of the object that has completed replication (progress)",
    "pending": 1000000,
    "completed": 3000000,
    "progress": "75%"
  }
