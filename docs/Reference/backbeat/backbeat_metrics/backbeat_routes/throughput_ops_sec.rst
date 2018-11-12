Throughput: Ops/sec
===================

**Route:** /_/backbeat/api/metrics/crr/<location-name>/throughput

This route returns the current throughput in number of completed
operations per second (or number of objects replicating per second) and
number of total bytes completing per second for the specified type and
location name.

**Example Output**

.. code::
  
  "throughput":{
    "description":"Current throughput for replication operations in ops/sec (count) and bytes/sec (size)",
    "results":{
      "count":"0.00",
      "size":"0.00"
    }
  }
