.. _activate_pruning_on_a_leader:

Activate Pruning on a Leader
============================

This operation allows leaders to prune and compact their sdb database. The
default configuration prevents the leaders from pruning due to performance
concerns.

If pruning is deactivated, this option has no effect until pruning is activated.

Request Parameters
------------------

``PUT /_/configuration/prune_on_leader``

This request takes a stringified JSON Boolean as a BODY parameter:

.. tabularcolumns:: lll
.. table::

   +-------+---------+-------------------------------------------------------+
   | Value | Type    | Meaning                                               |
   +=======+=========+=======================================================+
   | true  | Boolean | Pruning on this repd is allowed if it is a leader.    |
   +-------+---------+-------------------------------------------------------+
   | false | Boolean | Pruning on this repd is disallowed if it is a leader. |
   +-------+---------+-------------------------------------------------------+


Response Elements
-----------------

This route does not return any value, but the HTTP status code indicates
the request’s success or failure.

.. tabularcolumns:: ll
.. table::

   +-------------+-------------------------------------------------+
   | HTTP Status | Meaning                                         |
   +=============+=================================================+
   | 204         | Success (No body returned.)                     |
   +-------------+-------------------------------------------------+
   | other       | Failure (Body may provide failure description.) |
   +-------------+-------------------------------------------------+


Examples
--------

Sample Requests
~~~~~~~~~~~~~~~
               

The following sample request deactivates pruning on a specific repd:

::

   PUT /_/configuration/prune_on_leader HTTP/1.1
   Host: repd1.scality.com
   Content-Length: 5

   false

The following sample request activates pruning on a specific repd:

::

   PUT /_/configuration/prune_on_leader HTTP/1.1
   Host: repd1.scality.com
   Content-Length: 4

   true

Sample Response
~~~~~~~~~~~~~~~
               

::

   HTTP/1.1 204 OK
   Server: repd1
