Get Number of Buckets Handled by a Raft Session
===============================================

This operation gets the number of buckets handled by a Raft session.

Request Parameters
------------------

The Raft session must be targeted by its identifier ``{id}``. The http
request's path is formatted as follows:

.. code::

  /_/raft_sessions/{id}/bucketsNb

Response Elements
-----------------

The response body is the number of buckets handled by the Raft session.

Examples
--------

Request Sample
~~~~~~~~~~~~~~

This operation gets the number of buckets handled by Raft session id
``0``.

.. code::

   GET /_/raft_sessions/0/bucketsNb/ HTTP/1.1
   Host: bucketd.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: bucketd

   2
