.. _List Buckets:

List Buckets
============

This operation lists all buckets handled by the targeted repd's Raft
session.

Request Parameters
------------------

None

Response Elements
-----------------

The response body is an array containing name of buckets handled by the
repd's Raft session. If there is no bucket, an empty array is returned.

Examples
--------

Request Sample
~~~~~~~~~~~~~~

.. code::

   GET /_/buckets HTTP/1.1
   Host: repd0.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: repd0

   ["bucket1", "bucket2"]
