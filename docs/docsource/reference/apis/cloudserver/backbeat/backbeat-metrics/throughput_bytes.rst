Throughput: Bytes/sec
=====================

**Route:** ``/_/metrics/crr/all/throughput/<bucket>/<key>?versionId=<version-id>``

This route returns the throughput in number of total bytes completing
per second for the specified object.

**Example Output**:

::

    {
        "description": "Current throughput for object replication in bytes/sec
        (throughput)",
        "throughput": "0.00"
    }
