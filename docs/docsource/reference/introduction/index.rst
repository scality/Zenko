Introduction
============

Zenko is Scality's multi-cloud controller. It provides an open-source, open-\
platform gateway to enable replication, management, and general ease of use to
storage managers handling extreme data volumes over multiple clouds.
Zenko provides a single integration point from which cloud data can be managed
in several protocol spaces. Zenko either builds a namespace for cloud object
data stores, or ingests the namespace of supported cloud data stores to perform
powerful metadata-based file management and search tasks.

Zenko offers these capabilities by using the logic and much of the syntax of
Amazon Web Services' Simple Storage Service protocol (AWS S3) through its
CloudServer module. CloudServer replicates select S3 API calls verbatim,
providing ease of integration from existing cloud storage solutions. When
requested, it can also replicate data and manage replicated data in other
popular public clouds, such as Microsoft Azure Blob Stroage and Google Cloud
Storage, as well as private clouds like Scality's RING.

Most Zenko tasks can be managed using the web-based Orbit service. More advanced
users, however, may wish to interact directly with Zenko using its REST
APIs. This guide provides an API reference for the benefit of such users.

Some properties can only be managed through other APIs. Documentation is also
furnished here for addressing :ref:`Prometheus` and :ref:`Backbeat` through
their respective APIs.

API Basics
----------

Zenko operates by deploying and managing containerized instances of CloudServer,
a Scality service that reproduces relevant API calls from Amazon's Simple
Storage Service (S3) API. Using this RESTful API requires access credentials (an
access/secret key pair) in a well-formed request. The following sections
describe supported protocols and APIs, correct formatting for requests and
responses, possible error messages, and bucket encryption methods. 

.. toctree::
   :maxdepth: 1

   supported_apis
   https_protocols
   request_headers
   response_headers
   error_messages
   bucket_encryption
