Metrics
=======

For basic metrics, Backbeat gathers, processes, and exposes six data points:

-  Number of operations (ops)
-  Number of completed operations (opsdone)
-  Number of failed operations (opsfail)
-  Number of bytes (bytes)
-  Number of completed bytes (bytesdone)
-  Number of failed bytes (bytesfail)

Common Metrics API Syntax
-------------------------

Backbeat metrics routes are organized as follows:

.. code::

  /_/backbeat/api/metrics/<extension-type>/<location-name/[<metric-type>]/[<bucket>]/[<key>]?[versionId=<version-id>]

Where:

* ``<extension-type>`` currently supports only crr for replication metrics.
   
* ``<location-name>`` represents any current destination replication location(s)
  you have defined. To display metrics for all locations, use ``all``. All
  metric routes contain a location-name variable.
   
* ``<metric-type>`` is an optional field. If you specify a metric type, Backbeat
  returns the specified metric. If you omit it, Backbeat returns all available
  metrics for the given extension and location.
   
* ``<bucket>`` is an optional field. It carries the name of the bucket in which
  the object is expected to exist.
   
* ``<key>`` is an optional field. When getting CRR metrics for a particular
  object, it contains the object's key.

* ``<version-id>`` is an optional field. When getting CRR metrics for a
  particular object, it contains the object's version ID.

The site name must match the name specified in env\_replication\_endpoints under
the backbeat replication configurations in env/client\_template/group\_vars/all.

If the site is for a different cloud backend (e.g. AWS, Azure), use that
backend’s defined type (``aws\_s3`` or ``azure``, for example).

Design
------

To collect metrics, a separate Kafka producer and consumer pair (MetricsProducer
and MetricsConsumer) using their own Kafka topic (default to “backbeat-metrics”)
produce their own Kafka entries.

When a new CRR entry is sent to Kafka, a Kafka entry to the metrics topic is
produced, indicating to increase ops and bytes. On consumption of this metrics
entry, Redis keys are generated with the following schema:

Site-level CRR metrics Redis key:

.. code::

  <site-name>:<default-metrics-key>:<ops-or-bytes>:<normalized-timestamp>

Object-level CRR metrics Redis key:

.. code::

  <site-name>:<bucket-name>:<key-name>:<version-id>:<default-metrics-key>:<ops-or-bytes>:<normalized-timestamp>

A normalized timestamp determines the time interval on which to set the
data. The default metrics key ends with the type of data point it represents.

When the CRR entry is consumed from Kafka, processed, and the metadata for
replication status updated to a completed state (i.e. COMPLETED, FAILED), a
Kafka entry is sent to the metrics topic indicating to increase opsdone and
bytesdone if replication was successful or opsfail and bytesfail if replication
was unsuccessful. Again, on consumption of this metrics entry, Redis keys are
generated for their respective data points.

It is important to note that a MetricsProducer is initialized and producing to
the metrics topic both when the CRR topic BackbeatProducer produces and sends a
Kafka entry, and when the CRR topic BackbeatConsumer consumes and processes its
Kafka entries. The MetricsConsumer processes these Kafka metrics entries and
produces to Redis.

A single-location CRR entry produces four keys in total. The data points stored
in Redis are saved in intervals (default of 5 minutes) and are available up to
an expiry time (default of 15 minutes).

An object CRR entry creates one key. An initial key is set when the CRR
operation begins, storing the total size of the object to be replicated.  Then,
for each part of the object that is transferred to the destination, another key
is set (or incremented if a key already exists for the current timestamp) to
reflect the number of bytes that have completed replication. The data points
stored in Redis are saved in intervals (default of 5 minutes) and are available
up to an expiry time (default of 24 hours).

Throughput for object CRR entries are available up to an expiry time (default of
15 minutes). Object CRR throughput is the average bytes transferred per second
within the latest 15 minutes.

A BackbeatServer (default port 8900) and BackbeatAPI expose these metrics stored
in Redis by querying based on the prepended Redis keys.  Using these data
points, we can calculate simple metrics like backlog, number of completions,
progress, throughput, etc.

Backbeat Metrics Routes
-----------------------

Backbeat offers routes for the following services:

.. toctree::
   :maxdepth: 1
	      
   get_all_metrics
   get_pending
   get_backlog
   get_completions
   get_failures
   get_througput_ops-sec
   get_througput_bytes-sec
   get_progress

