.. _DELETE Bucket CORS:

DELETE Bucket CORS
==================

Use the DELETE Bucket CORS operation to remove the CORS configuration
for a bucket. This operation requires the S3:PutBucketCORS permission.

Requests
--------

Syntax
~~~~~~

.. code::

   DELETE /?cors HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authenticationInformation}}

.. note::

  The Request Syntax illustrates only a portion of the request headers.

Parameters
~~~~~~~~~~

The DELETE Bucket CORS operation does not use Request Parameters.

Headers
~~~~~~~

The DELETE Bucket CORS operation uses only request headers that are
common to all operations (refer to :ref:`Common Request Headers`).

Elements
~~~~~~~~

This operation does not use request elements.

Responses
---------

Headers
~~~~~~~

The DELETE Bucket CORS operation uses only response
headers that are common to all operations (refer to :ref:`Common Response Headers`).

Elements
~~~~~~~~

This operation does not use response elements.

Examples
--------

Request Sample
~~~~~~~~~~~~~~

.. code::

   DELETE ?cors HTTP/1.1
   Host: example.com
   Date: Mon, 15 Feb 2016 15:30:07 GMT
   Authorization: {{authenticationInformation}}

Request Sample
~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 204 No Content
   x-amz-id-2: YgIPIfBiKa2bj0KMgUAdQkf3ShJTOOpXUueF6QKo
   x-amz-request-id: 3848CD259D811111
   Date: Thu, 27 Jan 2011 00:49:26 GMT
   Server: ScalityS3
   Content-Length: 0
