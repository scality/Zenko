CloudServer API
===============

Zenko operates by deploying and managing containerized instances of CloudServer,
a Scality service that reproduces relevant API calls from Amazon's Simple
Storage Service (S3) API, and Blobserver, which reproduces Azure Blob API. Using
these RESTful APIs requires access credentials (an access/secret key pair) in a
well-formed request. The following sections describe supported protocols and
APIs, correct formatting for requests and responses, possible error messages,
and bucket encryption methods for CloudServer. These API requests and responses
map closely to Amazon S3 APIs. 

.. toctree::
   :maxdepth: 2

   common_features/index
   access_controls/index
   bucket_operations/index
   object_operations/index
   backbeat/index
