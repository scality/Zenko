.. _Location Management:

Location Management
===================

Users save data to files, which are stored as objects in buckets. Buckets are
stored in locations, which correspond (quite roughly) to a service and a region,
such as AWS us-east-1, or GCP europe-west1. Before you can establish a location,
you must have an account with at least one cloud storage service. This can
either be a public cloud, such as Amazon S3 or Google Cloud Platform, or
Scality's private cloud, the RING with S3 Connector. RING provides resilient,
reliable object storage, and S3 Connector provides Amazon S3-compatible command
set and namespace.

Public Clouds
-------------

If you don’t have a cloud storage account already configured, here are
some useful links to get started. These are subject to change without
notice.

-  Amazon S3:

   https://aws.amazon.com/s3/

-  Google Cloud Storage

   https://cloud.google.com/storage/getting-started/

-  Microsoft Azure Blob

   https://docs.microsoft.com/en-us/azure/storage/common/storage-create-storage-account#create-a-storage-account

-  DigitalOcean Spaces

   https://www.digitalocean.com/docs/spaces/quickstart/

-  Wasabi Hot Cloud Storage

   https://wasabi.com/s3-compatible-cloud-storage/

-  Red Hat Ceph RADOS Gateway

   https://access.redhat.com/documentation/en-us/red_hat_ceph_storage

See :version-ref:`Zenko Installation
<https://documentation.scality.com/Zenko/{version}/installation/index.html>` for
advice on sizing, cluster configuration, and other preparations.

Scality RING with S3 Connector
------------------------------

S3 Connector provides an Amazon S3-compliant frontend for the Scality RING
private cloud storage solution.

Except as noted, you can integrate to S3 Connector exactly as you would
integrate to any of the other S3-based cloud services, such as AWS, DigitalOcean
Spaces, Wasabi Hot Cloud, or Ceph RADOS Gateway. See the S3 Connector and RING
documentation at https://documentation.scality.com/ for more details on
deploying and configuring S3 Connector with the RING.

Scality RING with sproxyd
-------------------------

sproxyd presents a RING-native REST API providing direct object-store access to
the RING. If you are integrating to a RING that does not have an S3 Connector
installed, this is probably the API you use to access the RING.

.. _|product| Local:

|product| Local
---------------

The |product| Local file system is a convenient, easily configured test location
that enables product familiarization and simple operations. It is internal to
|product|, and serves as the default location for otherwise unnamed locations
that rely on the default "us-east-1" location. Because it is internal to
|product|, the **Add New Storage Location** prompt does not offer
configurations for credentials.

.. warning::

   While convenient for testing purposes, the |product| Local file system is not
   recommended for use in a production setting. The |product| Local file system
   introduces a single point of failure and is thus unsuitable for a
   highly-reliable, highly-available storage solution.

NFS Mount
---------

|product| can access information and file system metadata over the NFSv3 and NFSv4
protocols. To configure |product| to access NFS using out-of-band updates, review
the NFS host's /etc/exports file to find the relevant export path, hostname, and
NFS options. Use ``nfsstat`` on the NFS host to discover the relevant NFS
version and protocol.

.. important::

   Do not configure CRR for NFS mounts unless there is predictable down time for
   replication. For NFS CRR, |product| scans the NFS file system, then detects and
   replicates changes. It assumes that the NFS mount does not change after
   scanning but before replication is complete. Changes written after the initial scan
   but before replication completes may not be replicated.


You can:

*  :ref:`Add a Storage Location`
*  :ref:`Edit a Storage Location`
*  :ref:`Delete a Storage Location`

.. toctree::
   :hidden:
   :maxdepth: 1

   add_a_storage_location
   edit_a_storage_location
   delete_a_storage_location
