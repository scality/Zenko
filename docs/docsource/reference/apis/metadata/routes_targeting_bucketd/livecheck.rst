Livecheck
=========

This operation calls the no-op method for each Raft session to ensure
that the replication protocol is working.

Response Elements
-----------------

The code response returns the state of the clusters.

.. tabularcolumns:: cl
.. table::
   :widths: auto

   +----------+--------------------------------------------+
   | **Code** | **Description**                            |
   +==========+============================================+
   | 200      | All Raft sessions able to replicate        |
   +----------+--------------------------------------------+
   | 429      | Too many requests (limited to 1/300 sec)   |
   +----------+--------------------------------------------+
   | 500      | At least one Raft session cannot replicate |
   +----------+--------------------------------------------+

.. code::

   HTTP/1.1 200 OK
   Server: bucketd
   [
     { id: 1,
       leader: { host: '127.0.0.1', port: 4200 },
       isConnected: { '0': true, '1': true, '2': true, '3': true, '4': true },
       ableToReplicate: true,
       error: null },
     { id: 0,
       leader: { host: '127.0.0.5', port: 9043 },
       isConnected: { '0': true, '1': true, '2': true, '3': true, '4': true },
       ableToReplicate: true,
       error: null }
   ]
