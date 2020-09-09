Metadata Admin API
==================

Admin routes are exposed via a RESTful interface. These routes are used
for administration and for Backbeat, and target repd or bucketd,
depending on the request:

-  bucketd uses the same port as its usual services.
-  repd listens to a dedicated port defined by the ``adminPort`` config
   parameter to avoid mixing with the Raft protocol

Usage is determined by the request URL, which comprises two parts:

-  A mandatory prefix
-  An optional suffix that may include a query

All routes return a stringified JSON object/array containing different
elements.

.. toctree::
   :maxdepth: 2

   routes_targeting_bucketd/index
   routes_targeting_repd/index
