Cosmos
======

Cosmos provides translation from CloudServer to the NFS file system protocol. It
provides a REST API to CloudServer and translates CloudServer requests into
native file system requests. Cosmos enables CloudServer to detect changes made
to a non-object-storage repository with NFS access and to back up these changes
to a cloud storage location on a regular schedule. Cosmos serves these changes
for CloudServer ingestion over the S3 protocol.

.. image:: ../../graphics/Cosmos.svg
   :align: center

Because these venerable protocols do not maintain object-storage namespaces,
Cosmos cannot actively manage resources in the NFS space. Instead, changes to
the NFS space are regularly captured on a schedule set up in cron. At
preconfigured intervals, Cosmos detects changes on the NFS side and updates the
inferred namespace. This namespace can be used for such advanced features as
metadata search, lifecycle management, and cross-region replication.
