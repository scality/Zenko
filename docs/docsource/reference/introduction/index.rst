Introduction
============

Zenko is Scality's multi-cloud controller. It provides an open-source, open-\
platform gateway to enable replication, management, and general ease of use to
storage managers handling extreme data volumes over multiple clouds.
Zenko provides a single integration point from which cloud data can be managed
in several protocol spaces. Zenko either builds a namespace for cloud object
data stores, or ingests the namespace of supported cloud data stores to perform
powerful metadata-based file management and search tasks.

Zenko offers these capabilities using the logic and much of the syntax of
Amazon Web Services' Simple Storage Service protocol (AWS S3) through its
CloudServer module. CloudServer replicates select S3 API calls verbatim,
providing ease of integration from existing cloud storage solutions. When
requested, it can also replicate data and manage replicated data in other
popular public clouds, such as Microsoft Azure Blob Stroage and Google Cloud
Storage, as well as private clouds like Scality's RING.

With Release 1.2, Zenko introduced an Azure Blob-native storage API, Blobserver,
which manages stored objects in a Microsoft Azure Blob storage-compatible
namespace. The subset of Azure Blob-compatible APIs available to Blobserver are
also documented here.

Most Zenko tasks can be managed using the web-based Orbit service. More advanced
users, however, may wish to interact directly with Zenko using its REST
APIs. This guide provides an API reference for the benefit of such users.

Some properties can only be managed through other APIs. Documentation is also
furnished here for addressing :ref:`Prometheus` and :ref:`Backbeat`. Prometheus
API access is direct. The Backbeat API is accessed through CloudServer API
calls.

.. toctree::
   :maxdepth: 1

   bucket_encryption
