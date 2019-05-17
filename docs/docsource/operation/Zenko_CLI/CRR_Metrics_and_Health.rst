.. _`crr_metrics-health`:

CRR Metrics and Healthcheck
===========================

Zenko provides replication status tracking. The replication system
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

   * Get All Metrics
   * Get Backlog
   * Get Completions
   * Get Failures
   * Get Throughput: Ops/Sec
   * Get Throughput: Bytes/Sec
   * Get Progress

Backbeat also offers a healthcheck service that enables replication
component monitoring.

API documentation (routes, requests, and responses) for these services 
is provided in the *Zenko Reference Guide*.


