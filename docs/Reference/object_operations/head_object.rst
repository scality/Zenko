.. _HEAD Object:

HEAD Object
===========

The HEAD Object operation returns the metadata for an object without
returning the object itself (READ access to the object is necessary to
use the operation).

By default, the HEAD operation retrieves metadata from the current
version of an object. If the current version is a delete marker, Amazon
S3 behaves as if the object was deleted. To retrieve metadata from a
different version, use the versionIdsubresource.

..warning::

  The HEAD Object operation does not return a response body. Its response header is the same as for a GET Object operation.

Requests
--------

**Request Syntax**

.. code::

   HEAD /{{ObjectName}} HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Authorization: {{authorizationString}}
   Date: {{date}}

**Request Parameters**

The HEAD Object operation does not use Request Parameters.

**Request Headers**

The HEAD Object operation can use a number of optional request headers
in addition to those that are common to all operations (refer to :ref:`Common
Request Headers`).

+-----------------------+-----------------------+-----------------------+
| Header                | Type                  | Description           |
+=======================+=======================+=======================+
| If-Modified-Since     | string                | Return the object     |
|                       |                       | only if it has been   |
|                       |                       | modified since the    |
|                       |                       | specified time,       |
|                       |                       | otherwise return a    |
|                       |                       | ``304`` (not          |
|                       |                       | modified)             |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+
| If-Unmodified-Since   | string                | Return the object     |
|                       |                       | only if it has not    |
|                       |                       | been modified since   |
|                       |                       | the specified time,   |
|                       |                       | otherwise return a    |
|                       |                       | ``412`` (precondition |
|                       |                       | failed)               |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+
| If-Match              | string                | Return the object     |
|                       |                       | only if its entity    |
|                       |                       | tag (ETag) is the     |
|                       |                       | same as the one       |
|                       |                       | specified; otherwise, |
|                       |                       | return a ``412``      |
|                       |                       | (precondition failed) |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+
| If-None-Match         | string                | Return the object     |
|                       |                       | only if its entity    |
|                       |                       | tag (ETag) is         |
|                       |                       | different from the    |
|                       |                       | one specified;        |
|                       |                       | otherwise, return a   |
|                       |                       | ``304`` (not          |
|                       |                       | modified)             |
|                       |                       |                       |
|                       |                       | Default: None         |
|                       |                       |                       |
|                       |                       | Constraints: None     |
+-----------------------+-----------------------+-----------------------+

**Request Elements**

The HEAD Object operation does not use request elements.

Responses
---------

**Response Headers**

Implementation of the HEAD Object operation can include the following
response headers in addition to the response headers common to all
responses (refer to :ref:`Common Response Headers`).

+-----------------------+-----------------------+-----------------------+
| Header                | Type                  | Description           |
+=======================+=======================+=======================+
| x-amz-meta-\*         | string                | Headers starting with |
|                       |                       | this prefix are       |
|                       |                       | user-defined          |
|                       |                       | metadata, each of     |
|                       |                       | which is stored and   |
|                       |                       | returned as a set of  |
|                       |                       | key-value pairs.      |
|                       |                       | Zenko Enterprise does |
|                       |                       | not validate or       |
|                       |                       | interpret             |
|                       |                       | user-defined          |
|                       |                       | metadata.             |
+-----------------------+-----------------------+-----------------------+
| x-amz-version-id      | string                | Returns the version   |
|                       |                       | ID of the retrieved   |
|                       |                       | object if it has a    |
|                       |                       | unique version ID     |
|                       |                       |                       |
|                       |                       | Default: None         |
+-----------------------+-----------------------+-----------------------+
| x-amz-website         | string                | When a bucket is      |
| -redirect-location    |                       | configured as a       |
|                       |                       | website, this         |
|                       |                       | metadata can be set   |
|                       |                       | on the object so the  |
|                       |                       | website endpoint will |
|                       |                       | evaluate the request  |
|                       |                       | for the object as a   |
|                       |                       | 301 redirect to       |
|                       |                       | another object in the |
|                       |                       | same bucket or an     |
|                       |                       | external URL.         |
|                       |                       |                       |
|                       |                       | Default: None         |
+-----------------------+-----------------------+-----------------------+

**Response Elements**

The HEAD Object operation does not return response elements.

Examples
--------

**Returning an Object’s Metadata**

*Request Sample*

.. code::

   GET /my-document.pdf HTTP/1.1
   Host: {{bucketName}}.s3.scality.com
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Authorization: AWS AKIAIOSFODNN7EXAMPLE:02236Q3V0RonhpaBX5sCYVf1bNRuU=

*Response Sample*

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: ef8yU9AS1ed4OpIszj7UDNEHGran
   x-amz-request-id: 318BC8BC143432E5
   x-amz-version-id: 3HL4kqtJlcpXroDTDmjVBH40Nrjfkd
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Last-Modified: Sun, 1 Jan 2006 12:00:00 GMT
   ETag: "fba9dede5f27731c9771645a39863328"
   Content-Length: 434234
   Content-Type: text/plain
   Connection: close
   Server: ScalityS3

**Getting Metadata from a Specified Version of an Object**

*Request Sample*

.. code::

   HEAD /my-document.pdf?versionId=3HL4kqCxf3vjVBH40Nrjfkd HTTP/1.1
   Host: {{bucketName}}.s3.scality.com
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Authorization: AWS AKIAIOSFODNN7EXAMPLE:02236Q3V0WpaBX5sCYVf1bNRuU=

*Response Sample*

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: eftixk72aD6Ap51TnqcoF8epIszj7UDNEHGran
   x-amz-request-id: 318BC8BC143432E5
   x-amz-version-id: 3HL4kqtJlcpXrof3vjVBH40Nrjfkd
   Date: Wed, 28 Oct 2009 22:32:00 GMT
   Last-Modified: Sun, 1 Jan 2006 12:00:00 GMT
   ETag: "fba9dede5f27731c9771645a39863328"
   Content-Length: 434234
   Content-Type: text/plain
   Connection: close
   Server: ScalityS3
