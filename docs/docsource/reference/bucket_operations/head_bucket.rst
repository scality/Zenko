.. _HEAD Bucket:

HEAD Bucket
===========

The HEAD Bucket operation is used to determine whether a bucket exists
and can be accessed.

HEAD Bucket returns ``200 OK`` if the bucket is in the system and
accessible, otherwise the operation can return such responses as
``404 Not Found`` or ``403 Forbidden``.

Requests
--------

Syntax
~~~~~~

.. code::

   HEAD / HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Authorization: {{authorizationString}}

Parameters
~~~~~~~~~~

The HEAD Bucket operation does not use request parameters.

Headers
~~~~~~~

The HEAD Bucket operation uses only request headers
that are common to all operations (refer to :ref:`Common Request Headers`).

Elements
~~~~~~~~

The HEAD Bucket operation does not use request elements.

Responses
---------

Headers
~~~~~~~

The HEAD Bucket operation uses only response headers that are
common to all operations (refer to :ref:`Common Response Headers`).

Elements
~~~~~~~~

The HEAD Bucket operation does not return response elements.

Examples
--------

Determining the Status of a Particular Bucket
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Request
```````

.. code::

   HEAD / HTTP/1.1
   Date: Fri, 10 Feb 2012 21:34:55 GMT
   Authorization: {{authorizationString}}
   Host: {{bucketname}}.s3.scality.com
   Connection: Keep-Alive

Response
````````

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: JuKZqmXuiwFeDQxhD7M8KtsKobSzWA1QEjLbTMTagkKdBX2z7Il/jGhDeJ3j6s80
   x-amz-request-id: 32FE2CEB32F5EE25
   Date: Fri, 10 2012 21:34:56 GMT
   Server: ScalityS3
