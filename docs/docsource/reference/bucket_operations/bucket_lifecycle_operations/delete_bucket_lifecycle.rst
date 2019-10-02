.. _DELETE Bucket Lifecycle:

DELETE Bucket Lifecycle
=======================

The DELETE Bucket Lifecycle operations removes the lifecycle
configurations set on a bucket. To use this operation, you must have
permission to perform the S3:PutLifecycleConfiguration action.

Requests
--------

Syntax
~~~~~~

.. code::

  DELETE /?lifecycle HTTP/1.1
  Host: {{BucketName}}.{{StorageService}}.com
  Date: {{date}}
  Authorization: {{authorizationString}

Parameters
~~~~~~~~~~

The DELETE Bucket Lifecycle operation does not use request parameters.

Headers
~~~~~~~

The DELETE Bucket Lifecycle operation uses only request headers that are
common to all operations (refer to :ref:`Common Request Headers`).

Elements
~~~~~~~~

The DELETE Bucket Lifecycle operation does not use request elements.

Responses
---------

Headers
~~~~~~~

The DELETE Bucket Lifecycle operation uses only response headers that
are common to most responses (refer to :ref:`Common Response Headers`).

Examples
--------

The following example set shows a DELETE request to delete the lifecycle
configurations from the specified bucket.

The following is a sample request.

Request
~~~~~~~

.. code::

  DELETE /?lifecycle HTTP/1.1
  Host: examplebucket.s3.amazonaws.com
  Date: Wed, 14 Dec 2011 05:37:16 GMT
  Authorization: {{signatureValue}}

Response
~~~~~~~~

The following sample response shows a successful “204 No Content”
response. Objects in the bucket no longer expire.

.. code::

  HTTP/1.1 204 No Content
  x-amz-id-2: Uuag1LuByRx9e6j5OnimrSAMPLEtRPfTaOAa==
  x-amz-request-id: 656c76696e672SAMPLE5657374
  Date: Wed, 14 Dec 2011 05:37:16 GMT
  Connection: keep-alive
  Server: AmazonS3
