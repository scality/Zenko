S3 Data Service
===============

The S3 Data service is a local implementation of Scality’s
object-storage name space. It enables local storage that maintains
naming consistency with cloud name spaces. The S3 Data Service can
operate as a default data store where a local cloud is not available,
and latency makes a remote cloud infeasible. This service can be
configured as the local buffer for cloud storage operations: use it once
to write to a local object storage for replication to one or several
public or private clouds.

The S3 Data service is available for testing purposes only. It can
become unreliable under heavy loads. For production systems, it must be
backed by a replicated local data store.


