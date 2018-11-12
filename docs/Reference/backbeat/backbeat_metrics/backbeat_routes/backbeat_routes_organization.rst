Backbeat Routes Organization
============================

Routes are organized as follows:

.. code::

  /_/backbeat/api/metrics/<extension-type>/<location-name/[<metric-type>]/[<bucket>]/[<key>]?[versionId=<version-id>]

Where:

-  <extension-type> currently supports only crr for replication metrics

-  <location-name> represents any current destination replication
      locations you have defined. To display metrics for all locations,
      use all

-  <metric-type> is an optional field. If you specify a metric type,
      Backbeat returns the specified metric. If you omit it, Backbeat
      returns all available metrics for the given extension and
      location.

-  <bucket> is an optional field. It carries the name of the bucket in
      which the object is expected to exist.

-  <key> is an optional field. When getting CRR metrics for a particular
      object, it contains the object's key.

-  <version-id> is an optional field. When getting CRR metrics for a
      particular object, it contains the object's version ID.
