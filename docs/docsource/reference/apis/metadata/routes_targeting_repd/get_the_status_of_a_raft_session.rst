Get the Status of a Raft Session
================================

This operation gets the status of a Raft session, targeting a repd.

Request Parameters
------------------

None

Response Elements
-----------------

The response body is a string that indicates the current status of the
repd's Raft session. The return string is one of the following cases:

.. tabularcolumns:: ll
.. table::
   :widths: auto

   +-----------------------------+----------------------------------------+
   | **Name**                    | **Description**                        |
   +=============================+========================================+
   | ``isNotInitialized``        | The Raft session is not initialized    |
   +-----------------------------+----------------------------------------+
   | ``isInitialized``           | The Raft session is initialized        |
   +-----------------------------+----------------------------------------+
   | ``catchupFromLeader``       | repd is catching up from the leader    |
   +-----------------------------+----------------------------------------+
   | ``catchupFromDatastore``    | repd is catching up from the datastore |
   +-----------------------------+----------------------------------------+
   | ``replicatePendingEntries`` | repd is replicating entries            |
   +-----------------------------+----------------------------------------+

Examples
--------

Request Sample
~~~~~~~~~~~~~~

.. code::

   GET /_/status HTTP/1.1
   Host: repd0.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: repd0

   isInitialized
