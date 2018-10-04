S3 Cross-Region Replication (CRR) Statistics
--------------------------------------------

This feature enables replication status tracking. The replication system
exposes metrics through a REST API to monitor the replication of
pending, processing, and completed objects. It returns the number of
failures that occurred during replication, the current throughput (in
replication operations per second), and total bytes completing per second.
A health check system has also been implemented to monitor the replication
components.
