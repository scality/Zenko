.. _DELETE Bucket:

DELETE Bucket
=============

The DELETE Bucket operation deletes a named bucket only if the bucket is
empty.

.. note::

  Before a bucket can be deleted, all object must be deleted from the
  bucket and all ongoing multipart uploads must be aborted.

Requests
--------

Syntax
~~~~~~

.. code::

   DELETE / HTTP/1.1
   Host: {{BucketName}}.{{ConnectorName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authenticationInformation}

Parameters
~~~~~~~~~~

The DELETE Bucket operation does not use request parameters.

Headers
~~~~~~~

The DELETE Bucket operation uses only request headers
that are common to all operations (refer to :ref:`Common Request Headers`).

Elements
~~~~~~~~

The DELETE Bucket operation does not use request elements.

Responses
---------

Headers
~~~~~~~

The DELETE Bucket operation uses only response headers
that are common to all operations (refer to :ref:`Common Response Headers`).

Elements
~~~~~~~~

The DELETE Bucket operation does not return response elements.

.. code::

   Host: documentation.s3.scality.com
   Date: Tue, 21 Jun 2011 12:12:34 GMT

Examples
--------

Deleting the “documentation” Bucket
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request
```````

.. code::

   DELETE / HTTP/1.1
   Host: documentation.s3.scality.com
   Date: Tue, 21 Jun 2011 12:12:34 GMT
   Authorization: AWS pat:BAupPCpkyeIGKH2s5Je4Bc32bc=

Response
````````

.. code::

   HTTP/1.1 204 No Content
   Date: Tue, 21 Jun 2011 12:12:34 GMT
   Server: RestServer/1.0
   Content-Type: application/octet-stream
   Cache-Control: no-cache
   Connection: close
