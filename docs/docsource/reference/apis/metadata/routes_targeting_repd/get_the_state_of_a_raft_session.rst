Get the State of a Raft Session
===============================

This operation gets the state of a Raft session, targeting a repd.

Request Parameters
------------------

None

Response Elements
-----------------

The response body is an object containing state of the repd's Raft
session.

.. tabularcolumns:: llll
.. table::
   :widths: auto

   +-----------------+-----------------+-----------------+-----------------+
   | **API name**    | **Internal      | **Type**        | **Description** |
   |                 | name**          |                 |                 |
   +=================+=================+=================+=================+
   | ``term``        | ``term``        | Number          | Index of the    |
   |                 |                 |                 | Raft term       |
   +-----------------+-----------------+-----------------+-----------------+
   | ``voted``       | ``voted``       | Number          | Index of the    |
   |                 |                 |                 | last voted      |
   +-----------------+-----------------+-----------------+-----------------+
   | ``appended``    | ``aseq``        | Number          | Index of the    |
   |                 |                 |                 | last appended   |
   |                 |                 |                 | entry           |
   +-----------------+-----------------+-----------------+-----------------+
   | ``backups``     | ``bseq``        | Number          | The number of   |
   |                 |                 |                 | existing        |
   |                 |                 |                 | backups         |
   +-----------------+-----------------+-----------------+-----------------+
   | ``committing``  | ``cseq``        | Number          | Index of the    |
   |                 |                 |                 | last committing |
   |                 |                 |                 | entry           |
   +-----------------+-----------------+-----------------+-----------------+
   | ``committed``   | ``vseq``        | Number          | Index of the    |
   |                 |                 |                 | last committed  |
   |                 |                 |                 | entry           |
   +-----------------+-----------------+-----------------+-----------------+
   | ``pruned``      | ``prune``       | Number          | Index of the    |
   |                 |                 |                 | last pruned     |
   |                 |                 |                 | entry           |
   +-----------------+-----------------+-----------------+-----------------+

Examples
--------

Request Sample
~~~~~~~~~~~~~~

.. code::

   GET /_/raft/state HTTP/1.1
   Host: repd0.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: repd0

   {
     "term": 1,
     "voted": 1,
     "appended": 22,
     "backups": 0,
     "committing": 22,
     "committed": 22,
     "pruned": 0
   }
