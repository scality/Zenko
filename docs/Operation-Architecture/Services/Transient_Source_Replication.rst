Transient Source Replication
============================

Public cloud data storage services can charge substantial egress fees
for moving data out of their cloud. This can make it costly to use a
public cloud as a primary storage site from which other clouds instances
are replicated. Zenko offers a transient source as a configurable
option. If configured, the transient source accepts data to be
replicated in a transient storage location on the host machine,
replicates the data to the target clouds, and once all replications show
success, deletes the data from the transient source location. If
transient source replication is not configured, the cross-region
replication feature copies the data to the primary cloud (this could be
a public cloud or a private cloud, such as the RING), and replicates the
data to other clouds from there.

Garbage Collection
------------------

The Garbage Collector is a Node.js service that cleans up the transient
source buffer after a replication is complete. When the Backbeat
replication status processor receives notification from all targets that
a PUT job is complete (HTTP 200, indicating success), it enters a task
in the Kafka queue to delete the transient source buffer. The Garbage
Collector service is invoked and deletes files meeting the job
description.
