Supported Clouds and Services
=============================

Zenko replicates and manages data from one or many sources to one or several
destinations. Sources can be clouds or services, and targets can be of several
types of cloud backend.

.. _Supported Sources:

Supported Sources
-----------------

Zenko supports multiple-cloud storage operations natively using the Amazon
Simple Storage Service (S3) protocol. It can handle data from many S3-compatible
sources, as well as from servers using supported protocols.

The following Amazon S3-based clouds have been tested as Zenko-compatible
sources:

*  Amazon Simple Storage Service
*  Scality RING with S3 Connector
*  Wasabi Hot Cloud Storage
*  Ceph RADOS Gateway

In addition to its compatibility with S3 cloud frontends, Zenko can ingest data and
metadata from servers using the following protocols:

* Scality RING with sproxyd

  The sproxyd connector provides a flexible REST-based API for interacting with
  Scality RING. 

* Scality RING Scale-Out File System (SOFS)

  SOFS is the RING object store's native file system. SOFS is a POSIX-
  compatible parallel file system that provides file storage services on the
  RING. SOFS is a virtual file system, based on an internal distributed database
  deployed on the RING.

* Network File System (NFS)

  Zenko can ingest data and metadata from NFS sources, using a simple Orbit
  configuration process or from the command line. Because NFS does not maintain
  an object-store namespace, Zenko extrapolates one using out-of-band updates.

Other sources are under development. 

Supported Targets
-----------------

Zenko can replicate stored data at the site level to the following supported
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

Zenko cannot write to non-object-store endpoints such as NFS at this
time. Other target clouds and services are under development.
