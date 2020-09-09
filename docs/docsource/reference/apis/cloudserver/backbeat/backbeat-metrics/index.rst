Backbeat Metrics
================

Backbeat exposes various metric routes that return a response with an
HTTP code.

Routes
------

Routes are organized as follows:

``/_/metrics/<extension-type>/all/[<metric-type>]/[<bucket>]/[<key>]?[versionId=<version-id>]``

Where:

-  ``<extension-type>`` currently supports only ``crr`` for replication
   metrics
-  ``all`` represents all defined destination replication locations.
-  ``<metric-type>`` is an optional field. If you specify a metric type,
   Backbeat returns the specified metric. If you omit it, Backbeat
   returns all available metrics for the given extension.
-  ``<bucket>`` is an optional field. It carries the name of the bucket
   in which the object is expected to exist.
-  ``<key>`` is an optional field. When getting CRR metrics for a
   particular object, it contains the object’s key.
-  ``<version-id>`` is an optional field. When getting CRR metrics for a
   particular object, it contains the object's version ID.


.. toctree::
   :maxdepth: 2

   get_all_basic_metrics
   backlog
   completions
   throughput_ops
   throughput_bytes
