Get the Leader of a Raft Session
================================

This operation gets the leader of a Raft session, targeting a repd.

Request Parameters
------------------

None

Response Elements
-----------------

The response body is an object containing information on the leader of
the repd's Raft session.

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +----------+----------+-----------------------------------+
   | **Name** | **Type** | **Description**                   |
   +==========+==========+===================================+
   | ``host`` | String   | Hostname of the node              |
   +----------+----------+-----------------------------------+
   | ``port`` | Number   | Port dedicated to Raft operations |
   +----------+----------+-----------------------------------+

Examples
--------

Request Sample
~~~~~~~~~~~~~~

.. code::

   GET /_/raft/leader HTTP/1.1
   Host: repd0.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: repd0

   {
     "ip": "127.0.0.1",
     "port": 4200
   }
