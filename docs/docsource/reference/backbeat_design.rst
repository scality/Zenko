Design
======

For basic metrics, six data points are collected:

-  Number of operations (ops)
-  Number of completed operations (opsdone)
-  Number of failed operations (opsfail)
-  Number of bytes (bytes)
-  Number of completed bytes (bytesdone)
-  Number of failed bytes (bytesfail)

To collect metrics, a separate Kafka Producer and Consumer pair
(``MetricsProducer`` and ``MetricsConsumer``) using their own Kafka
topic (default to “backbeat-metrics”) produce their own Kafka entries.

When a new CRR entry is sent to Kafka, a Kafka entry to the metrics
topic is produced, indicating to increase ``ops`` and ``bytes``. On
consumption of this metrics entry, Redis keys are generated with the
following schema:

Site-level CRR metrics Redis key:

::

    <site-name>:<default-metrics-key>:<ops-or-bytes>:<normalized-timestamp>

Object-level CRR metrics Redis key:

::

    <site-name>:<bucket-name>:<key-name>:<version-id>:<default-metrics-key>:<ops-or-bytes>:<normalized-timestamp>

A normalized timestamp determines the time interval on which to set the
data. The default metrics key ends with the type of data point it
represents.

When the CRR entry is consumed from Kafka, processed, and the metadata
for replication status updated to a completed state (i.e. COMPLETED,
FAILED), a Kafka entry is sent to the metrics topic indicating to
increase ``opsdone`` and ``bytesdone`` if replication was successful or
``opsfail`` and ``bytesfail`` if replication was unsuccessful. Again, on
consumption of this metrics entry, Redis keys are generated for their
respective data points.

It is important to note that a ``MetricsProducer`` is initialized and
producing to the metrics topic both when the CRR topic
``BackbeatProducer`` produces and sends a Kafka entry, and when the CRR
topic ``BackbeatConsumer`` consumes and processes its Kafka entries. The
``MetricsConsumer`` processes these Kafka metrics entries and produces
to Redis.

A single-location CRR entry produces four keys in total. The data points
stored in Redis are saved in intervals (default of 5 minutes) and are
available up to an expiry time (default of 15 minutes).

An object CRR entry creates one key. An initial key is set when the CRR
operation begins, storing the total size of the object to be replicated.
Then, for each part of the object that is transferred to the
destination, another key is set (or incremented if a key already exists
for the current timestamp) to reflect the number of bytes that have
completed replication. The data points stored in Redis are saved in
intervals (default of 5 minutes) and are available up to an expiry time
(default of 24 hours).

Throughput for object CRR entries are available up to an expiry time
(default of 15 minutes). Object CRR throughput is the average bytes
transferred per second within the latest 15 minutes.

A ``BackbeatServer`` (default port 8900) and ``BackbeatAPI`` expose
these metrics stored in Redis by querying based on the prepended Redis
keys. Using these data points, we can calculate simple metrics like
backlog, number of completions, progress, throughput, etc.
