Raft Session Leader
===================

This operation gets a Raft session's leader by its ID.

Request Parameters
------------------

The requested Raft session must be identified by its ID, ``{id}``. The
http request's path is formatted as follows:

.. code::

  /_/raft_sessions/{id}/leader

Response Elements
-----------------

The response body is an object with two attributes: ``host`` and
``port``.

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

Examples
--------

Request Sample
~~~~~~~~~~~~~~

This request gets the leader for raft session id ``0``.

.. code::

   GET /_/raft_sessions/0/leader HTTP/1.1
   Host: bucketd.scality.com

Response Sample
~~~~~~~~~~~~~~~

.. code::

   HTTP/1.1 200 OK
   Server: bucketd

   {
     "host": "127.0.0.2",
     "id": 1,
     "port": 4300
     "adminPort": 4301,
     "site": "site_a"}
