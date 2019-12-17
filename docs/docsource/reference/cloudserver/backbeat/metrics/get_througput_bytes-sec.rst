.. _throughput_bytes:

Get Throughput: Bytes/Sec
=========================

This route returns the throughput in number of total bytes completing per second
for the specified object.

Request
-------

.. code::

   GET /_/backbeat/api/metrics/crr/<site-name>/throughput/<bucket>/<key>?versionId=<version-id>

Response
--------

.. code::

  {
    "description": "Current throughput for object replication in bytes/sec (throughput)",
    "throughput": "0.00"
  }
