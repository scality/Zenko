S3 Cross-Region Replication (CRR) Statistics
--------------------------------------------

This feature enables replication status tracking. The replication system
exposes metrics through a REST API to monitor the replication of
pending, processing, and completed objects. It returns the number of
errors that occurred during replication, the current throughput—in
operations per second or replicating objects per second—and the number
of total MB completing per second. A health check system has also been
implemented to monitor the replication components.
