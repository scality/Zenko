.. _`crr_metrics_health`:

CRR Metrics and Healthcheck
===========================

XDM provides replication status tracking. The replication system
exposes metrics through a REST API to monitor pending, processing, and
completed replication objects. It can return the number of failures that
occurred during replication, the current throughput (in replication
operations per second), and total bytes completing per second.

If source and destination buckets are set up to allow replication, when
a new object is added to the source bucket, the request for replicating
that object begins processing.

Metrics are gathered when entries are published to Kafka. When a Kafka
entry has completed processing and an object has replicated to its
destination bucket, further metrics are gathered to record its completion.

Backbeat offers routes for the following services:

   * :version-ref:`Get All Metrics <https://documentation.scality.com/Zenko/{version}/reference/cloudserver/bucket_operations/bucket_ingestion_metrics/get_all_metrics.html>`
   * :version-ref:`Get Backlog <https://documentation.scality.com/Zenko/{version}/reference/cloudserver/backbeat/metrics/get_backlog.html>`
   * :version-ref:`Get Completions <https://documentation.scality.com/Zenko/{version}/reference/cloudserver/backbeat/metrics/get_completions.html>`
   * :version-ref:`Get Failures <https://documentation.scality.com/Zenko/{version}/reference/cloudserver/backbeat/metrics/get_failures.html>`
   * :version-ref:`Get Pending <https://documentation.scality.com/Zenko/{version}/reference/cloudserver/backbeat/metrics/get_pending.html>`
   * :version-ref:`Get Throughput: Ops/Sec <https://documentation.scality.com/Zenko/{version}/reference/cloudserver/backbeat/metrics/get_throughput_ops-sec.html>`
   * :version-ref:`Get Throughput: Bytes/Sec <https://documentation.scality.com/Zenko/{version}/reference/cloudserver/backbeat/metrics/get_throughput_bytes-sec.html>`
   * :version-ref:`Get Progress <https://documentation.scality.com/Zenko/{version}/reference/cloudserver/backbeat/metrics/get_progress.html>`

Backbeat also offers a healthcheck service that enables replication
component monitoring.

API documentation (routes, requests, and responses) for these services 
is provided in the :version-ref:`Zenko Reference <https://documentation.scality.com/Zenko/{version}/reference/index.html>`.

.. note::

   Cross-region replication is not supported for Azure Blob Storage points of
   origin (Azure Blob frontend servers) in XDM version |version|.

