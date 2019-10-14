.. _`get completions`:

Get Completions
===============

This route returns the replication completions in number of objects and number
of total bytes transferred for the specified extension type and location.
Completions are only collected up to an EXPIRY time, set to **15 minutes** by
default

Request
-------

.. code::

   GET /_/backbeat/api/metrics/crr/<location-name>/completions

Response
--------

.. code::

  "completions":{
    "description":"Number of completed replication operations (count) and number of bytes transferred (size) in the last 900 seconds",
    "results":{
      "count":31,
      "size":"47.04"
    }
  }

