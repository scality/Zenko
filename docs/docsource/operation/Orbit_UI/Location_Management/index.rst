Location Management
===================

Users save data to files, which are stored as objects in buckets. Buckets 
are stored in locations, which correspond (quite roughly) to a service and
a region, such as AWS us-east-1, or GCP europe-west1. Before you can
establish a location in Orbit, you must have an account with at least one
cloud storage service. This can either be a public cloud, such as Amazon S3
or Google Cloud Platform, or Scality's private cloud, the RING with S3 
Connector. RING provides resilient, reliable object storage, and S3 
Connector provides Amazon S3-compatible command set and namespace.

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

See the *Installation and Setup Guide* for advice on sizing, cluster 
configuration, and other preparations. 

Scality RING with S3 Connector
------------------------------

S3 Connector provides an Amazon S3-compliant frontend for the Scality RING
private cloud storage solution. 

Except as noted, you can integrate to S3 Connector exactly as you would
integrate to any of the other S3-based cloud services, such as AWS,
DigitalOcean Spaces, Wasabi Hot Cloud, or Ceph RADOS Gateway. See
the S3 Connector and RING documentation at https://documentation.scality.com/
for more details on deploying and configuring S3 Connector with the
RING.

Scality RING with sproxyd
-------------------------

sproxyd presents a RING-native REST API providing direct object-store
access to the RING. If you are integrating to a RING that does not
have an S3 Connector installed, this is probably the API you use to
access the RING.

.. _Zenko\ Local:

Zenko Local
___________

The Zenko Local filesystem is a convenient, easily configured test
location that enables product familiarization and simple operations.
It is internal to Zenko, and serves as the default location for
otherwise unnamed locations that rely on the default "us-east-1"
location. Because it is internal to Zenko, the "Add New Storage
Location" prompt does not offer configurations for credentials or
bucket naming at setup time. These are handled elsewhere in the Orbit
user interface.

.. warning::

   While convenient for testing purposes, the Zenko Local filesystem
   is not recommended for use in a production setting. The Zenko Local
   filesystem introduces a single point of failure and is thus
   unsuitable for a highly-reliable, highly-available storage solution.

NFS Mount
---------

Zenko can access information over the NFSv3 and NFSv4 protocols. 
To configure Zenko to access NFS, review the NFS host's /etc/exports
file to find the relevant export path, hostname, and NFS options. Use
``nfsstat`` on the NFS host to discover the relevant NFS version and
protocol.


You can:

.. toctree::
   :maxdepth: 1
   
      Add a Storage Location <Adding_a_Storage_Location>
      Add a Transient Source Storage Location <../Advanced_Workflows/Adding_a_Transient_Source_Storage_Location>


