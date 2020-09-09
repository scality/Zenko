Get Leader Information of the Raft Session Handling a Bucket
============================================================

This operation gets the leader information of the Raft session handling
a bucket, identified by its name, targeting bucketd.

Request Parameters
------------------

A bucket name must be included in the request as shown here:

.. code::

  /_/buckets/{bucket-name}/leader

Response Elements
-----------------

The response body is an object with two attributes, as shown in the
following table.

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +----------+----------+-----------------------------------+
   | **Name** | **Type** | **Description**                   |
   +==========+==========+===================================+
   | ``host`` | String   | Hostname of the leader            |
   +----------+----------+-----------------------------------+
   | ``port`` | Number   | Port dedicated to Raft operations |
   +----------+----------+-----------------------------------+

If the requested bucket does not exist, a ``NoLeaderForDB`` error is
returned.

Examples
--------

Request Sample
~~~~~~~~~~~~~~

The following request gets leader information for the Raft session
handling the "test" bucket.

.. code::

   GET /_/buckets/test/leader HTTP/1.1
   Host: bucketd.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: bucketd

   {
     "host": "127.0.0.5",
     "port": 4600
   }
