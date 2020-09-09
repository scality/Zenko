Reset Backup Log Index
======================

This operation resets an index of backup logs, targeting repd. It resets
``bseq`` if the Raft session is created and pruning hasn't been
activated.

Request Parameters
------------------

This is a no-data 'POST' request in the following form:

.. code::

  /_/raft/state/reset

Response Elements
-----------------

An error is returned if the request fails.

Examples
--------

Request Sample
~~~~~~~~~~~~~~

.. code::

   POST /_/raft/state/reset HTTP/1.1
   Host: repd0.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 204 OK
   Server: repd0
