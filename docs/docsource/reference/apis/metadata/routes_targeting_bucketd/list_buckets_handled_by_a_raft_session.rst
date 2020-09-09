List Buckets Handled by a Raft Session
======================================

This operation lists all buckets handled by a Raft session.

Request Parameters
------------------

The targeting Raft session must be given by its identifier ``{id}``. The
http request's path is formatted as follows:

.. code::

  /_/raft_sessions/{id}/bucket

Response Elements
-----------------

The response body is an array containing the names of buckets handled by
the Raft session. If there is no bucket, an empty array is returned.

Examples
--------

Request Sample
~~~~~~~~~~~~~~

This request gets a list of buckets handled by Raft session id ``0``.

.. code::

   GET /_/raft_sessions/0/bucket/ HTTP/1.1
   Host: bucketd.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: bucketd

   ["bucket1", "bucket2"]
