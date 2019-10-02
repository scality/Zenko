.. _DELETE Bucket Website:

DELETE Bucket Website
=====================

Use the DELETE Bucket Website operation to remove the website
configuration for a bucket. This operation requires the
S3:DeleteBucketWebsite permission. If there is no bucket website
configuration, this operation will return a 204 error response.

Requests
--------

Syntax
~~~~~~

.. code::

   DELETE/?website HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authenticationInformation}}

.. note::

  The Request Syntax illustrates only a portion of the request headers.

Parameters
~~~~~~~~~~

The DELETE Bucket Website operation does not use Request Parameters.

Headers
~~~~~~~

The DELETE Bucket Website operation uses only request headers that are
common to all operations (refer to :ref:`Common Request Headers`).

Elements
~~~~~~~~

This operation does not use request elements.

Responses
---------

Headers
~~~~~~~

The PUT Bucket Website operation uses only response
headers that are common to all operations (refer to :ref:`Common Response Headers`).

Elements
~~~~~~~~

This operation does not use response elements.

Examples
--------

Request
~~~~~~~

.. code::

   DELETE ?website HTTP/1.1
   Host: example.com
   Date: Mon, 15 Feb 2016 15:30:07 GMT
   Authorization: {{authenticationInformation}}

Response
~~~~~~~~

.. code::

   HTTP/1.1 204 No Content
   x-amz-id-2: YgIPIfBiKa2bj0KMgUAdQkf3ShJTOOpXUueF6QKo
   x-amz-request-id: 3848CD259D811111
   Date: Thu, 27 Jan 2011 00:49:26 GMT
   Server: ScalityS3
