Throughput: Bytes/sec
=====================

**Route:** /_/backbeat/api/metrics/crr/<site-name>/throughput/<bucket>/<key>?versionId=<version-id>

This route returns the throughput in number of total bytes completing
per second for the specified object.

**Example Output**

.. code::

  {
    "description": "Current throughput for object replication in bytes/sec (throughput)",
    "throughput": "0.00"
  }
