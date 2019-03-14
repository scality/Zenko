Backlog
=======

**Route:** /_/backbeat/api/metrics/crr/<location-name>/backlog

This route returns the replication backlog in number of objects and
number of total bytes for the specified extension type and location
name. Replication backlog represents the objects that have been queued
for replication to another location, but for which the replication task
is not complete. If replication for an object fails, failed object
metrics are considered backlog.

**Example Output**

.. code::

  "backlog":{
    "description":"Number of incomplete replication operations (count) and number of incomplete bytes transferred (size)",
    "results":{
      "count":4,
      "size":"6.12"
    }
  }
