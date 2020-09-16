Introduction
============

Zenko, Scality's multi-cloud controller, provides an open-source,
platform-agnostic gateway to facilitate data replication and management for
storage managers handling extreme data volumes over multiple clouds. Zenko
provides a single integration point from which cloud data can be managed in
several protocol spaces. Zenko either builds a namespace for cloud object data
stores, or ingests the namespace of supported cloud data stores to perform
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
namespace. The subset of Azure Blob-compatible APIs available to Blobserver is
also documented here.

Most Zenko tasks can be managed using the web-based Orbit service. More advanced
users, however, may wish to interact directly with Zenko using its REST
APIs. This guide provides an API and command reference for the benefit of such
users.

Some properties can only be managed through other APIs. Documentation is also
furnished here for addressing :ref:`Prometheus` and :ref:`Backbeat`. Prometheus
API access is direct. The Backbeat API is accessed through CloudServer API
calls.

Zenko provides application programming interfaces via CloudServer, UTAPI,
and Prometheus.

Command Zenko by calling its REST API, using:

 * The AWS and Azure SDKs for your favorite programming language
 * aws-cli or azcli commands
 * Zenko-UI
 * A GUI-based client (such as CyberDuck)
 * Direct REST API calls (constucting calls in cURL, for example)

This reference describes available commands and APIs.

.. toctree::
   :maxdepth: 2

   supported_apis
   feature_compatibility_matrix
   bucket_encryption
