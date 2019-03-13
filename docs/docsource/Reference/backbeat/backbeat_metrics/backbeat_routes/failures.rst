Failures
========

**Route:** /_/backbeat/api/metrics/crr/<location-name>/failures

This route returns the replication failures in number of objects and
number of total bytes for the specified extension type and location.
Failures are collected only up to an EXPIRY time, currently set to a
default **15 minutes**.

**Example Output**

.. code::

  "failures":{
    "description":"Number of failed replication operations (count) and bytes (size) in the last 900 seconds",
    "results":{
      "count":"5",
      "size":"10.12"
    }
  }
