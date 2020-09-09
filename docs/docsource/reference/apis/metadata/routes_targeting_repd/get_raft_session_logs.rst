Get Raft Session Logs
=====================

This operation gets a repd's Raft session logs.

Request Parameters
------------------

The following optional parameters specify the logs to be retrieved.

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +-----------+----------+--------------------------------------------------+
   | **Name**  | **Type** | **Description**                                  |
   +===========+==========+==================================================+
   | ``begin`` | Number   | Index of the first log to retrieve (starts at 1) |
   +-----------+----------+--------------------------------------------------+
   | ``limit`` | Number   | Maximum number of logs to retrieve               |
   +-----------+----------+--------------------------------------------------+

The http request's path is formatted as follows:

.. code::

  /_/raft/log?begin={begin}&limit={limit}

Response Elements
-----------------

The response body is an object that has two attributes: ``info`` and
``log``. The value for the ``info`` attribute is an object that has
attributes ``start``, ``cseq`` and ``prune`` as in the following table.

.. tabularcolumns:: lll
.. table::
   :widths: auto

   +----------------+----------+----------------------------------------------------+
   | **Name**       | **Type** | **Description**                                    |
   +================+==========+====================================================+
   | ``info``       | Object   | Index of retrieved logs                            |
   +----------------+----------+----------------------------------------------------+
   | ``info.start`` | Number   | Index of the first retrieved log                   |
   +----------------+----------+----------------------------------------------------+
   | ``info.cseq``  | Number   | Index of the last available log in Metadata        |
   +----------------+----------+----------------------------------------------------+
   | ``info.prune`` | Number   | Index of the last log in Metadata's local database |
   +----------------+----------+----------------------------------------------------+

The value for the ``log`` attribute is an array of logs where the index
``0`` maps the repd log's index ``info.start``. Every log entry has the
attributes shown below.

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

The following request gets 100 logs, starting at index ``52``.

.. code::

   GET /_/raft/log?begin=52&limit=100 HTTP/1.1
   Host: repd0.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: repd0

   {
     "info": {
       "start": 52,
       "cseq": 53,
       "prune": 1
     },
     "log": [
       {
         "db": "metastore",
         "entries": [
           {
             "key": "db/test",
             "value": "value-52"        }
         ],
         "method": 3
       },
       {
         "db": "test",
         "entries": [
           {
             "key": "object-key",
             "value": "value-53"        }
         ],
         "method": 3
       }
     ]
   }

.. note::

   This request is for 100 logs, indexed starting from 52, but because the index
   of the last log (``cseq``) is ``53``, only two log entries are returned.
