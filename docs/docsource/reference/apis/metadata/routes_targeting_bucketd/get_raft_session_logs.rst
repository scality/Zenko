Get Raft Session Logs
=====================

This operation gets logs of a Raft session given by its id ``id``, and
targets a bucketd.

Request Parameters
------------------

Available parameters are ``{id}``, ``{begin}``, ``{limit}``, and
``{targetLeader}``. The requested Raft session must be identified by its
id ``{id}``. Every log is indexed by a number. A range of logs can be
specified by using two parameters ``begin`` and ``limit`` for the
expected first log index and the maximum number of returned logs,
respectively. The total number of retrieved logs is at most 10K.
Moreover, the request can be directed towards the leader or a follower
of the relevant Raft session to comply with the required consistency
constraints using the targetLeader Boolean.

The http request's path is formatted as follows:

.. code::

  /_/raft_sessions/{id}/log?begin={begin}&limit={limit}&targetLeader={true/false}

Available parameters for the route are shown in the following table.

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +------------------+----------+-------------------------------------------------+
   | **Name**         | **Type** | **Description**                                 |
   +==================+==========+=================================================+
   | ``id``           | Number   | Raft session identifier                         |
   +------------------+----------+-------------------------------------------------+
   | ``begin``        | Number   | Index of the first retrieved log (starts at 1)  |
   +------------------+----------+-------------------------------------------------+
   | ``limit``        | Number   | Maximum number of logs to be retrieved          |
   +------------------+----------+-------------------------------------------------+
   | ``targetLeader`` | Boolean  | ``true``: target a leader. ``false`` by default |
   +------------------+----------+-------------------------------------------------+

Response Elements
-----------------

The response body is an object with two attributes, ``info`` and
``log``.

The value for the ``info`` attribute is an object with attributes
``start``, ``cseq``, and ``prune``, as shown in the following table.

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +----------------+----------+----------------------------------------------------+
   | **Name**       | **Type** | **Description**                                    |
   +================+==========+====================================================+
   | ``info``       | Object   | Information index of retrieved logs                |
   +----------------+----------+----------------------------------------------------+
   | ``info.start`` | Number   | Index of the first retrieved log                   |
   +----------------+----------+----------------------------------------------------+
   | ``info.cseq``  | Number   | Index of the last available log in Metadata        |
   +----------------+----------+----------------------------------------------------+
   | ``info.prune`` | Number   | Index of the last log in Metadata's local database |
   +----------------+----------+----------------------------------------------------+

The value for the ``log`` attribute is an array of logs, the index of
which begins as defined in ``info.start``. Every log entry has
attributes as shown below.

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +-----------------------------+-----------------------+-----------------------+
   | **Name**                    | **Type**              | **Description**       |
   +=============================+=======================+=======================+
   | ``log``                     | Array                 | Array of retrieved    |
   |                             |                       | logs                  |
   +-----------------------------+-----------------------+-----------------------+
   | ``log[x]``                  | Object                | A log entry           |
   +-----------------------------+-----------------------+-----------------------+
   | ``log[x].db``               | String                | Database/bucket name  |
   +-----------------------------+-----------------------+-----------------------+
   | ``log[x].entries``          | Array                 | Array of key/value    |
   |                             |                       | objects               |
   +-----------------------------+-----------------------+-----------------------+
   | ``log[x].entries[y]``       | Object                | A key/value object    |
   +-----------------------------+-----------------------+-----------------------+
   | ``log[x].entries[y].key``   | String                | A key                 |
   +-----------------------------+-----------------------+-----------------------+
   | ``log[x].entries[y].value`` | String                | A value               |
   +-----------------------------+-----------------------+-----------------------+
   | ``log[x].entries[y].type``  | String                | Type of value         |
   |                             |                       | (optional)            |
   +-----------------------------+-----------------------+-----------------------+
   | ``log[x].method``           | Number                | Mapping to an         |
   |                             |                       | operation (put, get   |
   |                             |                       | etc.)                 |
   +-----------------------------+-----------------------+-----------------------+

Examples
--------

Request Sample
~~~~~~~~~~~~~~

The following request to the leader of the Raft session of id ``0`` gets
2 logs with an index starting at ``1``.

.. code::

   GET /_/raft_sessions/0/log?begin=1&limit=2&targetLeader=true HTTP/1.1
   Host: bucketd.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: bucketd

   {
     "info": {
       "start": 1,
       "cseq": 53,
       "prune": 1
     },
     "log": [
       {
         "db": "metastore",
         "entries": [
           {
             "key": "repd/0",
             "value": "value-1"        }
         ],
         "method": 3
       },
       {
         "db": "metastore",
         "entries": [
           {
             "key": "repd/0",
             "value": "value-2"        }
         ],
         "method": 3
       }
     ]
   }
