Cosmos
======

Cosmos provides translation from CloudServer to the NFS and SMB/CIFS
file system protocols. It provides a REST API to CloudServer and
translates CloudServer requests into native file system requests.
The anticipated use case for Cosmos is to enable CloudServer to detect
changes made to a non-object-storage repository with NFS or SMB/CIFS
access and to back up these changes to a cloud storage location on a
regular schedule. Cosmos serves these changes for CloudServer 
ingestion over the S3 protocol.

.. image:: ../Resources/Images/Cosmos.svg
   :align: center

Because these venerable protocols do not maintain object-storage
namespaces, Cosmos cannot actively manage resources in the SMB/CIFS or
NFS spaces. Instead, changes to the SMB/CIFS or NFS spaces are
regularly captured on a schedule set up in cron. At preconfigured
intervals, Cosmos detects changes to the NFS or SMB/CIFS side and
triggers replication through CloudServer, which sends updates to the
configured storage backend.

Cosmos instances must be preconfigured to a server and to a protocol.
For example, if the accounting department has a server with both NFS
and SMB/CIFS access to the same data, to connect to that server using
both protocols (this is not a likely scenario) would require configuring
two endpoints. Access to discrete NFS mount points or SMB servers likewise
requires configuring multiple Cosmos instances.