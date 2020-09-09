List Raft Sessions
==================

This operation lists every Raft session with its essential information.

Request Parameters
------------------

None

Response Elements
-----------------

The response body is an array containing objects of the following form:

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +------------------------------+----------+------------------------------------+
   | **Name**                     | **Type** | **Description**                    |
   +==============================+==========+====================================+
   | ``id``                       | Number   | Raft session identifier            |
   +------------------------------+----------+------------------------------------+
   | ``raftMembers``              | Array    | Nodes related to the Raft session  |
   +------------------------------+----------+------------------------------------+
   | ``raftMembers[x].host``      | String   | Hostname of the node               |
   +------------------------------+----------+------------------------------------+
   | ``raftMembers[x].id``        | Number   | Node identifier                    |
   +------------------------------+----------+------------------------------------+
   | ``raftMembers[x].port``      | Number   | Port dedicated to Raft operations  |
   +------------------------------+----------+------------------------------------+
   | ``raftMembers[x].adminPort`` | Number   | Port dedicated to admin operations |
   +------------------------------+----------+------------------------------------+
   | ``raftMembers[x].site``      | String   | Site name (in multisite scenarios) |
   +------------------------------+----------+------------------------------------+
   | ``connectedToLeader``        | Boolean  | Assert leader existance            |
   +------------------------------+----------+------------------------------------+

Examples
--------

Request Sample
~~~~~~~~~~~~~~

.. code::

   GET /_/raft_sessions HTTP/1.1
   Host: bucketd.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: bucketd

   [{
     "id": 1,
     "raftMembers": [{
       "host": "repd1.scality.com",
       "id": 1,
       "port": 4200,
       "adminPort": 5200,
       "site": "main_site"  },{
       "host": "repd2.scality.com",
       "id": 2,
       "port": 4200,
       "adminPort": 5200,
       "site": "main_site"  }],
     "connectedToLeader": true
   }]
