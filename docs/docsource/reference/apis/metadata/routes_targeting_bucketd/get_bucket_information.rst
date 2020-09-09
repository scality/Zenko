Get Bucket Information
======================

Given a bucket name, this operation gets information for the bucket and
the leader of the Raft session handling the bucket, targeting bucketd.

Request Parameters
------------------

The bucket name must included in the request, as shown here:

.. code::

  /_/buckets/{bucket-name}

Response Elements
-----------------

The response body is an object with the following attributes:

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +-------------------+----------+------------------------------------------------+
   | **Name**          | **Type** | **Description**                                |
   +===================+==========+================================================+
   | ``raftSessionId`` | Number   | Raft session identifier                        |
   +-------------------+----------+------------------------------------------------+
   | ``creating``      | Boolean  | Flag indicating creating status                |
   +-------------------+----------+------------------------------------------------+
   | ``deleting``      | Boolean  | Flag indicating deleting status                |
   +-------------------+----------+------------------------------------------------+
   | ``version``       | Number   | Bucket Format version identifier               |
   +-------------------+----------+------------------------------------------------+
   | ``leader``        | Object   | Leader of the Raft session handling the bucket |
   +-------------------+----------+------------------------------------------------+
   | ``leader.host``   | String   | Hostname of the leader                         |
   +-------------------+----------+------------------------------------------------+
   | ``leader.port``   | Number   | Port dedicated to Raft operations              |
   +-------------------+----------+------------------------------------------------+

If the DBAPI daemon is not ready, a ``DBAPINotReady`` error is returned.
If the requested bucket does not exist, a ``DBNotFound`` error is
returned. If the Raft session does not run or the leader is not
connected, the leader attribute is ``undefined``.

Examples
--------

Request Sample
~~~~~~~~~~~~~~

The following request gets leader information for the Raft session
handling the "test" bucket.

.. code::

   GET /_/buckets/test HTTP/1.1
   Host: bucketd.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: bucketd

   {
     "raftSessionId": 0,
     "creating": false,
     "deleting": false,
     "version": 1,
     "leader": {
       "host": "127.0.0.4",
       "port": 4500
     }
   }
