API Basics
==========

Zenko operates by deploying and managing containerized instances of CloudServer,
a Scality service that reproduces relevant API calls from Amazon's Simple
Storage Service (S3) API. Using this RESTful API requires access credentials (an
access/secret key pair) in a well-formed request. The following sections
describe supported protocols and APIs, correct formatting for requests and
responses, possible error messages, and bucket encryption methods. 

.. toctree::
   :maxdepth: 2

   supported_apis
   https_protocols
   request_headers
   response_headers
   error_messages
   bucket_encryption
