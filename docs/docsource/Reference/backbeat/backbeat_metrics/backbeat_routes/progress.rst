Progress
========

**Route:** /_/backbeat/api/metrics/crr/<site-name>/progress/<bucket>/<key>?versionId=<version-id>

This route returns replication progress in bytes transferred for the
specified object.

**Example Output**

.. code::

  {
    "description": "Number of bytes to be replicated (pending), number of bytes transferred to the destination (completed), and percentage of the object that has completed replication (progress)",
    "pending": 1000000,
    "completed": 3000000,
    "progress": "75%"
  }
