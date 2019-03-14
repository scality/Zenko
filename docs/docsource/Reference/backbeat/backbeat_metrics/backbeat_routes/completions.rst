Completions
===========

**Route:** /_/backbeat/api/metrics/crr/<location-name>/completions

This route returns the replication completions in number of objects and
number of total bytes transferred for the specified extension type and
location. Completions are only collected up to an EXPIRY time, which is
currently set to **15 minutes**.

**Example Output**

.. code::

  "completions":{
    "description":"Number of completed replication operations (count) and number of bytes transferred (size) in the last 900 seconds",
    "results":{
      "count":31,
      "size":"47.04"
    }
  }
