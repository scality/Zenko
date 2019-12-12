Out-of-Band Updates
===================

Zenko depends on object storage metadata for its operation. When a new Zenko
location is configured, Zenko encounters a new object storage system. If Zenko
does not understand the location's namespace, Zenko creates a new Zenko
namespace and uses it to perform all of its data management tasks (metadata
search, replication, lifecycle transition and expiration). If Zenko recognizes
the existing namespace, it can ingest the existing namespace metadata, in a
process called an out-of-band update.

Out-of-band updates are available for Scality's RING object storage system via
S3 Connector or for RINGs using the Scale-Out File System (SOFS), via the NFS
protocol. When each location is established, versioning must be enabled.
Out-of-band updates for S3C offers metrics; for NFS services, this feature
remains under development.

.. note::

   This feature is not yet implemented for Azure Blob frontends. 
