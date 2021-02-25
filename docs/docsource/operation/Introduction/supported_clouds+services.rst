Supported Clouds and Services
=============================

|product| replicates and manages data from one or many sources to one or many
destinations. Sources can be clouds or services, and targets can be of several
types of cloud backend.

Supported Sources
-----------------

|product| supports multiple-cloud storage operations natively using the Amazon
Simple Storage Service (S3) protocol. It can handle data from many S3-compatible
sources, as well as from servers using supported protocols. |product| can also
operate natively using Microsoft Azure Blob Storage as a front end. Operation is
analogous to S3-based interactions, but as of release 1.2, feature parity has
not been attained.

The following Amazon S3-based clouds have been tested as |product|-compatible
sources:

*  Amazon Simple Storage Service
*  Scality RING with S3 Connector
*  Wasabi Hot Cloud Storage
*  Ceph RADOS Gateway

In addition to its compatibility with S3- and Azure Blob-compatible cloud
frontends, |product| can ingest data and metadata from servers using the following
protocols:

* Scality RING with sproxyd

  The sproxyd connector provides a flexible REST-based API for interacting with
  Scality RING. 

* Scality RING Scale-Out File System (SOFS)

  SOFS is the RING object store's native file system. SOFS is a POSIX-
  compatible parallel file system that provides file storage services on the
  RING. SOFS is a virtual file system, based on an internal distributed database
  deployed on the RING.

* Network File System (NFS)

  |product| can ingest data and metadata from NFS sources, using a simple
  |product| GUI configuration process or from the command line. Because NFS does
  not maintain an object-store namespace, |product| extrapolates one using
  out-of-band updates.

* Amazon Web Services (AWS)

  |product| can ingest data and metadata from AWS sources, using a simple
  |product| configuration process or from the command line. Because AWS's
  object-store namespace is not accessible to customers, |product| queries
  Amazon buckets and extrapolates its own namespace using out-of-band updates.

Other sources are under development. 

Supported Targets
-----------------

|product| can replicate stored data at the site level to the following supported
private and public clouds:

*  Amazon S3-based public clouds:

   *  Amazon Simple Storage Service
   *  DigitalOcean Spaces
   *  Wasabi Hot Cloud Storage

*  Amazon-S3-based private clouds:

   * Scality RING S3 Connector
   * Red Hat Ceph RADOS Gateway

*  Other public clouds:

   * Google Cloud Storage
   * Microsoft Azure Storage

|product| cannot write to non-object-store endpoints such as NFS. Other target
clouds and services are under development.
