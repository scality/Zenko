Raft Session Info
=================

This operation gets Raft session information by the session's id,
``id``.

Request Parameters
------------------

The requested Raft session must be identified by its id ``{id}``. The
http request's path is formatted as follows:

.. code::

  /_/raft_sessions/{id}/info

Response Elements
-----------------

The response body is an object with three attributes: ``leader``,
``connected``, and ``disconnected``. The value for the ``leader``
attribute is an object containing the leader's information (``host``,
``port``, ``adminPort``, and ``id``). The value for the ``connected``
attribute is an array containing objects, each for a running member of
the session. The value for the ``disconnected`` attribute is an array
containing objects, each for a stopped (or disconnected) member of the
session. These attributes are of the following form:

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +-------------------------------+----------+-------------------------------------+
   | **Name**                      | **Type** | **Description**                     |
   +===============================+==========+=====================================+
   | ``leader``                    | Object   | Raft session leader information     |
   +-------------------------------+----------+-------------------------------------+
   | ``leader.host``               | String   | Hostname of the node                |
   +-------------------------------+----------+-------------------------------------+
   | ``leader.port``               | Number   | Port dedicated to Raft operations   |
   +-------------------------------+----------+-------------------------------------+
   | ``leader.id``                 | Number   | Node identifier                     |
   +-------------------------------+----------+-------------------------------------+
   | ``leader.adminPort``          | Number   | Port dedicated to admin operations  |
   +-------------------------------+----------+-------------------------------------+
   | ``connected``                 | Array    | Connected nodes of the RS           |
   +-------------------------------+----------+-------------------------------------+
   | ``connected[x].host``         | String   | Hostname of the node                |
   +-------------------------------+----------+-------------------------------------+
   | ``connected[x].id``           | Number   | Node identifier                     |
   +-------------------------------+----------+-------------------------------------+
   | ``connected[x].port``         | Number   | Port dedicated to Raft operations   |
   +-------------------------------+----------+-------------------------------------+
   | ``connected[x].adminPort``    | Number   | Port dedicated to admin operations  |
   +-------------------------------+----------+-------------------------------------+
   | ``connected[x].site``         | String   | Site name (in multi-site scenarios) |
   +-------------------------------+----------+-------------------------------------+
   | ``disconnected``              | Array    | Disconnected nodes of the RS        |
   +-------------------------------+----------+-------------------------------------+
   | ``disconnected[x].host``      | String   | Hostname of the node                |
   +-------------------------------+----------+-------------------------------------+
   | ``disconnected[x].id``        | Number   | Node identifier                     |
   +-------------------------------+----------+-------------------------------------+
   | ``disconnected[x].port``      | Number   | Port dedicated to Raft operations   |
   +-------------------------------+----------+-------------------------------------+
   | ``disconnected[x].adminPort`` | Number   | Port dedicated to admin operations  |
   +-------------------------------+----------+-------------------------------------+
   | ``disconnected[x].site``      | String   | Site name (in multi-site scenarios) |
   +-------------------------------+----------+-------------------------------------+

Examples
--------

Request Sample
~~~~~~~~~~~~~~

Getting information for Raft session id ``0``.

.. code::

   GET /_/raft_sessions/0/info HTTP/1.1
   Host: bucketd.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: bucketd

   {
     "connected": [
       {
         "host": "127.0.0.1",
         "id": 0,
         "port": 4200,
         "adminPort": 4201,
         "site": "site_a"    },
       {
         "host": "127.0.0.2",
         "id": 1,
         "port": 4300,
         "adminPort": 4301,
         "site": "site_a"    },
       {
         "host": "127.0.0.3",
         "id": 2,
         "port": 4400,
         "adminPort": 4401,
         "site": "site_a"    },
       {
         "host": "127.0.0.4",
         "id": 3,
         "port": 4500,
         "adminPort": 4501,
         "site": "site_a"    }
     ],
     "disconnected": [
       {
         "host": "127.0.0.5",
         "id": 4,
         "port": 4600,
         "adminPort": 4601,
         "site": "site_a"    }
     ],
     "leader": {
         "host": "127.0.0.1",
         "id": 0,
         "port": 4200,
         "adminPort": 4201,
         "site": "site_a"  }
   }
