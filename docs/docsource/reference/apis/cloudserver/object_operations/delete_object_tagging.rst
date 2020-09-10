.. _DELETE Object Tagging:

DELETE Object Tagging
=====================

This implementation of the DELETE operation uses the tagging subresource
to remove the entire tag set from the specified object. For more
information about managing object tags, refer to `Object
Tagging <http://docs.aws.amazon.com/AmazonS3/latest/dev/object-tagging.html>`__
in the Amazon Simple Storage Service Developer Guide.

To use the DELETE Object Tagging operation, the user must have
permission to perform the ``s3:DeleteObjectTagging`` action.

To delete tags of a specific object version, add the ``versionId`` query
parameter in the request (permission for the
``s3:DeleteObjectVersionTagging`` action is required).

Requests
--------

Syntax
~~~~~~

.. code::

   DELETE /ObjectKey/ ?tagging HTTP/1.1
   Host: {{BucketName}}.{{StorageService}}.com
   Date: {{date}}
   Content-Length: {{length}}
   Authorization: {{authenticationInformation}}

Parameters
~~~~~~~~~~

The DELETE Object Tagging operation does not use Request Parameters.

Headers
~~~~~~~

The DELETE Object Tagging operation uses only request
headers that are common to all operations (refer to :ref:`Common Request
Headers`).

Elements
~~~~~~~~

The DELETE Object Tagging operation does not use request elements.

Responses
---------

Headers
~~~~~~~

The DELETE Object Tagging operation uses onlyresponse
headers that are common to all operations (refer to :ref:`Common Response Headers`).

Elements
~~~~~~~~

The DELETE Object Tagging operation does not return response elements.

Examples
--------

Request
~~~~~~~

.. code::

   DELETE exampleobject/?tagging HTTP/1.1
   Host: {{bucketname}}.s3.scality.com
   Date: Wed, 12 Oct 2016 17:50:00 GMT
   Authorization: {{authorizationString}}

Response
~~~~~~~~

The following successful response shows Amazon S3 returning a 204 No Content
response. The tag set for the object has been removed.

.. code::

   HTTP/1.1 204 No Content
   Date: Wed, 25 Nov 2016 12:00:00 GMT
   Connection: close
   Server: ScalityS3
