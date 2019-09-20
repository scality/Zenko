Introduction
============

The Zenko application programming interface’s operations are explained and detailed herein, their
parameters, responses, and errors.

.. toctree::
   :maxdepth: 2

<<<<<<< HEAD
   official_api_support/index
   https_protocols
=======
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
>>>>>>> 3c83e8c... documentation: ZENKOIO-96_fix_API_headings
   bucket_encryption
