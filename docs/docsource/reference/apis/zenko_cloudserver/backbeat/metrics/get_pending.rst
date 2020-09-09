.. _`get pending`:

Get Pending
===========

This route returns pending replication in number of objects and number of total
bytes. The byte total represents data only and does not include the size of
associated metadata.

Pending replication represents objects that have been queued up for replication
to another site, but for which the replication task has failed or has not been
completed.

Request
-------

.. code::

   GET /_/backbeat/api/metrics/crr/<location-name>/pending


Response
--------

.. code::

    "pending":{
      "description":"Number of pending replication operations (count) and bytes (size)",
      "results":{
        "count":0,
        "size":0
      }
    }
