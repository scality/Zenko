.. _DELETE Bucket Replication:

DELETE Bucket Replication
=========================

Deletes the replication subresource associated with the specified bucket. This
operation requires permission for the s3:DeleteReplicationConfiguration action.

Requests
--------

Syntax
~~~~~~

.. code::

   DELETE /?replication HTTP/1.1
   Host: bucketname.s3.amazonaws.com
   Date: date
   Authorization: authorization string (see Authenticating Requests (AWS Signature Version
           4))

Parameters
~~~~~~~~~~

The PUT Bucket operation does not use request parameters.

Headers
~~~~~~~

This operation uses only request headers that are
common to all operations.

Elements
~~~~~~~~

This operation does not use request elements.

Responses
---------

Headers
~~~~~~~

This operation uses only response headers that are common to most responses.

Elements
~~~~~~~~

This operation does not use request elements.

Example
-------

The following DELETE request deletes the replication subresource from the
specified bucket. This removes the replication configuration set for the bucket.

.. code::

   DELETE /?replication HTTP/1.1
   Host: examplebucket.s3.amazonaws.com
   Date: Wed, 11 Feb 2015 05:37:16 GMT
   20150211T171320Z

   Authorization: signatureValue
