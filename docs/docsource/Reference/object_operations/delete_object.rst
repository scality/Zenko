.. _`DELETE Object`:

DELETE Object
=============

The DELETE Object operation removes the null version (if there is one)
of an object and inserts a delete marker, which becomes the current
version of the object. If there isn’t a null version, Zenko does not remove
any objects.

Only the bucket owner can remove a specific version, using the versionId
subresource, whichpermanently deletes the version. If the object deleted
is a delete marker, Zenko sets the response header x-amz-delete-marker to
true.

Requests
--------

**Request Syntax**

.. code::

   HTTP/1.1 200 OK
   x-amz-id-2: Yd6PSJxJFQeTYJ/3dDO7miqJfVMXXW0S2Hijo3WFs4bz6oe2QCVXasxXLZdMfASd
   x-amz-request-id: 80DF413BB3D28A25
   Date: Fri, 13 Apr 2012 05:54:59 GMT
   ETag: "dd038b344cf9553547f8b395a814b274"
   Content-Length: 0
   Server: ScalityS3

**Request Parameters**

The DELETE Object operation does not use Request Parameters.

**Request Headers**

Implementation of the DELETE Object operation uses only request headers
that are common to all operations (refer to :ref:`Common Request Headers`).

**Request Elements**

The DELETE Object operation does not use request elements.

Responses
---------

**Response Headers**

Implementation of the DELETE Object operation can include the following
response headers in addition to the response headers that are common to
all operations (refer to :ref:`Common Response Headers`).

.. tabularcolumns:: X{0.25\textwidth}X{0.10\textwidth}X{0.60\textwidth}
.. table::
 
   +-----------------------+-----------------------+-----------------------+
   | Header                | Type                  | Description           |
   +=======================+=======================+=======================+
   | x-amz-delete-marker   | Boolean               | Valid Values:         |
   |                       |                       | ``true`` \| ``false`` |
   |                       |                       |                       |
   |                       |                       | Returns ``true`` if a |
   |                       |                       | delete marker was     |
   |                       |                       | created by the delete |
   |                       |                       | operation. If a       |
   |                       |                       | specific version was  |
   |                       |                       | deleted, returns      |
   |                       |                       | ``true`` if the       |
   |                       |                       | deleted version was a |
   |                       |                       | delete marker.        |
   |                       |                       |                       |
   |                       |                       | Default: ``false``    |
   +-----------------------+-----------------------+-----------------------+
   | x-amz-version-id      | string                | Returns the version   |
   |                       |                       | ID of the delete      |
   |                       |                       | marker created as a   |
   |                       |                       | result of the DELETE  |
   |                       |                       | operation. If a       |
   |                       |                       | specific object       |
   |                       |                       | version is deleted,   |
   |                       |                       | the value returned by |
   |                       |                       | this header is the    |
   |                       |                       | version ID of the     |
   |                       |                       | object version        |
   |                       |                       | deleted.              |
   |                       |                       |                       |
   |                       |                       | Default: None         |
   +-----------------------+-----------------------+-----------------------+

**Response Elements**

The DELETE Object operation does not return response elements.

Examples
--------

**Single Object Delete**

The request sample deletes the object, sampledocument.pdf.

*Request Sample*

.. code::

   DELETE /sampledocument.pdf HTTP/1.1
   Host: {{bucketname}}.s3.scality.com
   Date: Wed, 12 Oct 2009 17:50:00 GMT
   Authorization: {{authorizationString}}
   Content-Type: text/plain

*Response Sample*

.. code::

   HTTP/1.1 204 NoContent
   x-amz-id-2: LriYPLdmOdAiIfgSm/F1YsViT1LW94/xUQxMsF7xiEb1a0wiIOIxl+zbwZ163pt7
   x-amz-request-id: 0A49CE4060975EAC
   Date: Wed, 12 Oct 2009 17:50:00 GMT
   Content-Length: 0
   Connection: close
   Server: ScalityS3

**Deleting a Specified Version of an Object**

The *Request Sample* deletes the specified version of the object,
sampledocument2.pdf.

*Request Sample*

.. code::

   DELETE /sampledocument2.pdf?versionId=UIORUnfndfiufdisojhr398493jfdkjFJjkndnqUifhnw89493jJFJ HTTP/1.1
   Host: {{bucketname}}.s3.scality.com
   Date: Wed, 12 Oct 2009 17:50:00 GMT
   Authorization: {{authorizationString}}
   Content-Type: text/plain
   Content-Length: 0

*Response Sample*

.. code::

   HTTP/1.1 204 NoContent
   x-amz-id-2: LriYPLdmOdAiIfgSm/F1YsViT1LW94/xUQxMsF7xiEb1a0wiIOIxl+zbwZ163pt7
   x-amz-request-id: 0A49CE4060975EAC
   x-amz-version-id: UIORUnfndfiufdisojhr398493jfdkjFJjkndnqUifhnw89493jJFJ
   Date: Wed, 12 Oct 2009 17:50:00 GMT
   Content-Length: 0
   Connection: close
   Server: ScalityS3

*Response Sample if the Object Deleted is a Delete Marker**

.. code::

   HTTP/1.1 204 NoContent
   x-amz-id-2: LriYPLdmOdAiIfgSm/F1YsViT1LW94/xUQxMsF7xiEb1a0wiIOIxl+zbwZ163pt7
   x-amz-request-id: 0A49CE4060975EAC
   x-amz-version-id: 3/L4kqtJlcpXroDTDmJ+rmSpXd3dIbrHY+MTRCxf3vjVBH40Nr8X8gdRQBpUMLUo
   x-amz-delete-marker: true
   Date: Wed, 12 Oct 2009 17:50:00 GMT
   Content-Length: 0
   Connection: close
   Server: ScalityS3
