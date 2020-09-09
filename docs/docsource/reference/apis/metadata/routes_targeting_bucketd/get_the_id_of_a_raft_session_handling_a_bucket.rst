Get the ID of a Raft Session Handling a Bucket
==============================================

This operation gets the id of the Raft session handling a bucket, using
the bucket's name.

Request Parameters
------------------

The bucket name must be included in the request as shown here:

.. code::

  /_/buckets/{bucket-name}/id

Response Elements
-----------------

The response body is an identifier of the Raft session handling the
requested bucket. If the requested bucket does not exist, a
``DBNotFound`` error is returned.

Examples
--------

Request Sample
~~~~~~~~~~~~~~

The following request gets the identifier of the Raft session handling
the bucket named 'test'.

.. code::

   GET /_/buckets/test/id HTTP/1.1
   Host: bucketd.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: bucketd

   1
