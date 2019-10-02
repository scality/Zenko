.. _`get failures`:

Get Failures
============

This route returns replication failures in number of objects and number of
total bytes for the specified extension type and location. Failures are
collected only up to an EXPIRY time, set by default to **15 minutes**.

Request
-------

.. code::

   GET /_/backbeat/api/metrics/crr/<location-name>/failures


Response
--------

.. code::

  "failures":{
    "description":"Number of failed replication operations (count) and bytes (size) in the last 900 seconds",
    "results":{
      "count":"5",
      "size":"10.12"
    }
  }

